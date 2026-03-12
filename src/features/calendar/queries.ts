import { and, eq, gte, lte, ne, or } from "drizzle-orm";
import { cartoes, lancamentos } from "@/db/schema";
import {
	buildOptionSets,
	buildSluggedFilters,
	mapLancamentosData,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchRecentEstablishments,
} from "@/features/transactions/queries";
import { db } from "@/shared/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import type { CalendarData, CalendarEvent } from "@/shared/lib/types/calendar";
import { formatDateKey } from "@/shared/utils/calendar";
import { parsePeriod } from "@/shared/utils/period";

const PAYMENT_METHOD_BOLETO = "Boleto";
const TRANSACTION_TYPE_TRANSFERENCIA = "Transferência";

const clampDayInMonth = (year: number, monthIndex: number, day: number) => {
	const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
	if (day < 1) return 1;
	if (day > lastDay) return lastDay;
	return day;
};

const isWithinRange = (value: string | null, start: string, end: string) => {
	if (!value) return false;
	return value >= start && value <= end;
};

type FetchCalendarDataParams = {
	userId: string;
	period: string;
};

export const fetchCalendarData = async ({
	userId,
	period,
}: FetchCalendarDataParams): Promise<CalendarData> => {
	const { year, month } = parsePeriod(period);
	const monthIndex = month - 1;
	const rangeStart = new Date(Date.UTC(year, monthIndex, 1));
	const rangeEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
	const rangeStartKey = formatDateKey(rangeStart);
	const rangeEndKey = formatDateKey(rangeEnd);

	const [lancamentoRows, cardRows, filterSources] = await Promise.all([
		db.query.lancamentos.findMany({
			where: and(
				eq(lancamentos.userId, userId),
				ne(lancamentos.transactionType, TRANSACTION_TYPE_TRANSFERENCIA),
				or(
					// Lançamentos cuja data de compra esteja no período do calendário
					and(
						gte(lancamentos.purchaseDate, rangeStart),
						lte(lancamentos.purchaseDate, rangeEnd),
					),
					// Boletos cuja data de vencimento esteja no período do calendário
					and(
						eq(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
						gte(lancamentos.dueDate, rangeStart),
						lte(lancamentos.dueDate, rangeEnd),
					),
					// Lançamentos de cartão do período (para calcular totais de vencimento)
					and(
						eq(lancamentos.period, period),
						ne(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
					),
				),
			),
			with: {
				pagador: true,
				conta: true,
				cartao: true,
				categoria: true,
			},
		}),
		db.query.cartoes.findMany({
			where: eq(cartoes.userId, userId),
		}),
		fetchLancamentoFilterSources(userId),
	]);

	const lancamentosData = mapLancamentosData(lancamentoRows);
	const events: CalendarEvent[] = [];

	const cardTotals = new Map<string, number>();
	for (const item of lancamentosData) {
		if (
			!item.cartaoId ||
			item.period !== period ||
			item.pagadorRole !== PAGADOR_ROLE_ADMIN
		) {
			continue;
		}
		const amount = Math.abs(item.amount ?? 0);
		cardTotals.set(
			item.cartaoId,
			(cardTotals.get(item.cartaoId) ?? 0) + amount,
		);
	}

	for (const item of lancamentosData) {
		const isBoleto = item.paymentMethod === PAYMENT_METHOD_BOLETO;
		const isAdminPagador = item.pagadorRole === PAGADOR_ROLE_ADMIN;

		// Para boletos, exibir apenas na data de vencimento e apenas se for pagador admin
		if (isBoleto) {
			if (
				isAdminPagador &&
				item.dueDate &&
				isWithinRange(item.dueDate, rangeStartKey, rangeEndKey)
			) {
				events.push({
					id: `${item.id}:boleto`,
					type: "boleto",
					date: item.dueDate,
					lancamento: item,
				});
			}
		} else {
			// Para outros tipos de lançamento, exibir na data de compra
			if (!isAdminPagador) {
				continue;
			}
			const purchaseDateKey = item.purchaseDate.slice(0, 10);
			if (isWithinRange(purchaseDateKey, rangeStartKey, rangeEndKey)) {
				events.push({
					id: item.id,
					type: "lancamento",
					date: purchaseDateKey,
					lancamento: item,
				});
			}
		}
	}

	// Exibir vencimentos apenas de cartões com lançamentos do pagador admin
	for (const card of cardRows) {
		if (!cardTotals.has(card.id)) {
			continue;
		}

		const dueDayNumber = Number.parseInt(card.dueDay ?? "", 10);
		if (Number.isNaN(dueDayNumber)) {
			continue;
		}

		const normalizedDay = clampDayInMonth(year, monthIndex, dueDayNumber);
		const dueDateKey = formatDateKey(
			new Date(Date.UTC(year, monthIndex, normalizedDay)),
		);

		events.push({
			id: `${card.id}:cartao`,
			type: "cartao",
			date: dueDateKey,
			card: {
				id: card.id,
				name: card.name,
				dueDay: card.dueDay,
				closingDay: card.closingDay,
				brand: card.brand ?? null,
				status: card.status,
				logo: card.logo ?? null,
				totalDue: cardTotals.get(card.id) ?? null,
			},
		});
	}

	const typePriority: Record<CalendarEvent["type"], number> = {
		lancamento: 0,
		boleto: 1,
		cartao: 2,
	};

	events.sort((a, b) => {
		if (a.date === b.date) {
			return typePriority[a.type] - typePriority[b.type];
		}
		return a.date.localeCompare(b.date);
	});

	const sluggedFilters = buildSluggedFilters(filterSources);
	const optionSets = buildOptionSets({
		...sluggedFilters,
		pagadorRows: filterSources.pagadorRows,
	});

	const estabelecimentos = await fetchRecentEstablishments(userId);

	return {
		events,
		formOptions: {
			pagadorOptions: optionSets.pagadorOptions,
			splitPagadorOptions: optionSets.splitPagadorOptions,
			defaultPagadorId: optionSets.defaultPagadorId,
			contaOptions: optionSets.contaOptions,
			cartaoOptions: optionSets.cartaoOptions,
			categoriaOptions: optionSets.categoriaOptions,
			estabelecimentos,
		},
	};
};
