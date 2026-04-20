import { and, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { cards, transactions } from "@/db/schema";
import {
	buildOptionSets,
	buildSluggedFilters,
	mapTransactionsData,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import type { CalendarData, CalendarEvent } from "@/shared/lib/types/calendar";
import { formatDateKey } from "@/shared/utils/calendar";
import { parsePeriod } from "@/shared/utils/period";

const PAYMENT_METHOD_BOLETO = "Boleto";
const TRANSACTION_TYPE_TRANSFERENCIA = "Transferência";
const PAYMENT_PREFIX = "Pagamento fatura - ";

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
	const adminPayerId = await getAdminPayerId(userId);

	const [transactionRows, cardRows, filterSources] = await Promise.all([
		db.query.transactions.findMany({
			where: and(
				eq(transactions.userId, userId),
				adminPayerId ? eq(transactions.payerId, adminPayerId) : sql`false`,
				ne(transactions.transactionType, TRANSACTION_TYPE_TRANSFERENCIA),
				or(
					// Lançamentos cuja data de compra esteja no período do calendário
					and(
						gte(transactions.purchaseDate, rangeStart),
						lte(transactions.purchaseDate, rangeEnd),
					),
					// Boletos cuja data de vencimento esteja no período do calendário
					and(
						eq(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
						gte(transactions.dueDate, rangeStart),
						lte(transactions.dueDate, rangeEnd),
					),
					// Lançamentos de cartão do período (para calcular totais de vencimento)
					and(
						eq(transactions.period, period),
						ne(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
					),
				),
			),
			with: {
				payer: true,
				financialAccount: true,
				card: true,
				category: true,
			},
		}),
		db.query.cards.findMany({
			where: eq(cards.userId, userId),
		}),
		fetchTransactionFilterSources(userId),
	]);

	const transactionData = mapTransactionsData(transactionRows);
	const events: CalendarEvent[] = [];

	// Totais por cartão para exibir no vencimento
	const cardTotals = new Map<string, number>();
	for (const item of transactionData) {
		if (!item.cardId || item.period !== period) continue;
		const amount = Math.abs(item.amount ?? 0);
		cardTotals.set(item.cardId, (cardTotals.get(item.cardId) ?? 0) + amount);
	}

	// Pagamentos de fatura por nome do cartão → data de pagamento
	const paymentByCardName = new Map<string, string | null>();
	for (const item of transactionData) {
		if (!item.name.startsWith(PAYMENT_PREFIX)) continue;
		const cardName = item.name.slice(PAYMENT_PREFIX.length);
		paymentByCardName.set(cardName, item.purchaseDate?.slice(0, 10) ?? null);
	}

	for (const item of transactionData) {
		// Pagamentos de fatura são consumidos pelos eventos de cartão
		if (item.name.startsWith(PAYMENT_PREFIX)) continue;

		const isBoleto = item.paymentMethod === PAYMENT_METHOD_BOLETO;

		if (isBoleto) {
			if (
				item.dueDate &&
				isWithinRange(item.dueDate, rangeStartKey, rangeEndKey)
			) {
				events.push({
					id: `${item.id}:boleto`,
					type: "boleto",
					date: item.dueDate,
					transaction: item,
				});
			}
		} else {
			const purchaseDateKey = item.purchaseDate.slice(0, 10);
			if (isWithinRange(purchaseDateKey, rangeStartKey, rangeEndKey)) {
				events.push({
					id: item.id,
					type: "transaction",
					date: purchaseDateKey,
					transaction: item,
				});
			}
		}
	}

	// Vencimentos de cartões com lançamentos no período
	for (const card of cardRows) {
		if (!cardTotals.has(card.id)) continue;

		const dueDayNumber = Number.parseInt(card.dueDay ?? "", 10);
		if (Number.isNaN(dueDayNumber)) continue;

		const normalizedDay = clampDayInMonth(year, monthIndex, dueDayNumber);
		const dueDateKey = formatDateKey(
			new Date(Date.UTC(year, monthIndex, normalizedDay)),
		);

		const isPaid = paymentByCardName.has(card.name);
		const paymentDate = paymentByCardName.get(card.name) ?? null;

		events.push({
			id: `${card.id}:cartao`,
			type: "card",
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
				isPaid,
				paymentDate,
			},
		});
	}

	const typePriority: Record<CalendarEvent["type"], number> = {
		transaction: 0,
		boleto: 1,
		card: 2,
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
		payerRows: filterSources.payerRows,
	});

	const estabelecimentos = await fetchRecentEstablishments(userId);

	return {
		events,
		formOptions: {
			payerOptions: optionSets.payerOptions,
			splitPayerOptions: optionSets.splitPayerOptions,
			defaultPayerId: optionSets.defaultPayerId,
			accountOptions: optionSets.accountOptions,
			cardOptions: optionSets.cardOptions,
			categoryOptions: optionSets.categoryOptions,
			estabelecimentos,
		},
	};
};
