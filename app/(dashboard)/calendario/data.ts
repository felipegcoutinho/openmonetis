import { and, eq, gte, lte, ne, or } from "drizzle-orm";
import { getRecentEstablishmentsAction } from "@/app/(dashboard)/lancamentos/actions";
import type {
	CalendarData,
	CalendarEvent,
} from "@/components/calendario/types";
import { cartoes, lancamentos } from "@/db/schema";
import { db } from "@/lib/db";
import {
	buildOptionSets,
	buildSluggedFilters,
	fetchLancamentoFilterSources,
	mapLancamentosData,
} from "@/lib/lancamentos/page-helpers";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { getInvoiceDateRange } from "@/lib/utils/period";

const PAYMENT_METHOD_BOLETO = "Boleto";
const TRANSACTION_TYPE_TRANSFERENCIA = "Transferência";

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const parsePeriod = (period: string) => {
	const [yearStr, monthStr] = period.split("-");
	const year = Number.parseInt(yearStr ?? "", 10);
	const month = Number.parseInt(monthStr ?? "", 10);

	if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
		throw new Error(`Período inválido: ${period}`);
	}

	return { year, monthIndex: month - 1 };
};

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
	const { year, monthIndex } = parsePeriod(period);
	const rangeStart = new Date(Date.UTC(year, monthIndex, 1));
	const rangeEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
	const rangeStartKey = toDateKey(rangeStart);
	const rangeEndKey = toDateKey(rangeEnd);

	// Hoje (YYYY-MM-DD): recorrente no cartão só entra no total/evento quando a data da ocorrência já passou
	const today = new Date();
	const todayKey = toDateKey(today);

	// Intervalo ampliado para incluir compras que entram na fatura do mês (ciclo por dia de fechamento)
	const extendedStart = new Date(Date.UTC(year, monthIndex - 1, 1));
	const extendedEnd = new Date(Date.UTC(year, monthIndex + 1, 31));

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
					// Lançamentos de cartão no intervalo ampliado (para totais por ciclo de fatura)
					and(
						gte(lancamentos.purchaseDate, extendedStart),
						lte(lancamentos.purchaseDate, extendedEnd),
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

	// Total por cartão: soma por ciclo de fatura (data de compra no intervalo da fatura do mês)
	const cardTotals = new Map<string, number>();
	for (const card of cardRows) {
		const closingDayNum = Math.min(
			31,
			Math.max(1, Number.parseInt(card.closingDay ?? "1", 10) || 1),
		);
		const { start: invoiceStart, end: invoiceEnd } = getInvoiceDateRange(
			period,
			closingDayNum,
		);
		const invoiceStartKey = toDateKey(invoiceStart);
		const invoiceEndKey = toDateKey(invoiceEnd);

		let total = 0;
		for (const item of lancamentosData) {
			if (
				item.cartaoId !== card.id ||
				item.pagadorRole !== PAGADOR_ROLE_ADMIN
			) {
				continue;
			}
			const purchaseKey = item.purchaseDate.slice(0, 10);
			// Recorrente: só soma ao total do cartão quando o dia da cobrança já passou
			if (
				item.condition === "Recorrente" &&
				purchaseKey > todayKey
			) {
				continue;
			}
			if (
				purchaseKey >= invoiceStartKey &&
				purchaseKey <= invoiceEndKey
			) {
				total += Math.abs(item.amount ?? 0);
			}
		}
		if (total > 0) {
			cardTotals.set(card.id, total);
		}
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
		const dueDateKey = toDateKey(
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

	const estabelecimentos = await getRecentEstablishmentsAction();

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
