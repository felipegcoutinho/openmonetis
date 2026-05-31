import {
	and,
	asc,
	eq,
	gte,
	ilike,
	isNull,
	lte,
	not,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { cards, financialAccounts, transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { toDateOnlyString } from "@/shared/utils/date";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import {
	addMonthsToPeriod,
	buildPeriodRange,
	formatCompactPeriodLabel,
} from "@/shared/utils/period";

const RECEITA = "Receita";
const DESPESA = "Despesa";
const PAYMENT_METHOD_CARD = "Cartão de crédito";
const PAYMENT_METHOD_BOLETO = "Boleto";

export type PayerMonthlyBreakdown = {
	totalExpenses: number;
	totalIncomes: number;
	paymentSplits: Record<"card" | "boleto" | "instant", number>;
};

export type PayerHistoryPoint = {
	period: string;
	label: string;
	receitas: number;
	despesas: number;
};

export type PayerCardUsageItem = {
	id: string;
	name: string;
	logo: string | null;
	amount: number;
};

type PayerBoletoStats = {
	totalAmount: number;
	paidAmount: number;
	pendingAmount: number;
	paidCount: number;
	pendingCount: number;
};

export type PayerBoletoItem = {
	id: string;
	name: string;
	amount: number;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	isSettled: boolean;
	transactionType: string;
};

export type PayerPaymentStatusData = {
	paidAmount: number;
	paidCount: number;
	pendingAmount: number;
	pendingCount: number;
	totalAmount: number;
};

const excludeAutoInvoiceEntries = () =>
	or(
		isNull(transactions.note),
		not(ilike(transactions.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
	);

type BaseFilters = {
	userId: string;
	payerId: string;
	period: string;
};

export async function fetchPayerMonthlyBreakdown({
	userId,
	payerId,
	period,
}: BaseFilters): Promise<PayerMonthlyBreakdown> {
	const rows = await db
		.select({
			paymentMethod: transactions.paymentMethod,
			transactionType: transactions.transactionType,
			totalAmount: sum(transactions.amount).as("total"),
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				eq(transactions.period, period),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(transactions.paymentMethod, transactions.transactionType);

	const paymentSplits: PayerMonthlyBreakdown["paymentSplits"] = {
		card: 0,
		boleto: 0,
		instant: 0,
	};
	let totalExpenses = 0;
	let totalIncomes = 0;

	for (const row of rows) {
		const total = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === DESPESA) {
			totalExpenses += total;
			if (row.paymentMethod === PAYMENT_METHOD_CARD) {
				paymentSplits.card += total;
			} else if (row.paymentMethod === PAYMENT_METHOD_BOLETO) {
				paymentSplits.boleto += total;
			} else {
				paymentSplits.instant += total;
			}
		} else if (row.transactionType === RECEITA) {
			totalIncomes += total;
		}
	}

	return {
		totalExpenses,
		totalIncomes,
		paymentSplits,
	};
}

export async function fetchPayerHistory({
	userId,
	payerId,
	period,
	months = 6,
}: BaseFilters & { months?: number }): Promise<PayerHistoryPoint[]> {
	const startPeriod = addMonthsToPeriod(period, -(Math.max(months, 1) - 1));
	const windowPeriods = buildPeriodRange(startPeriod, period);
	const start = windowPeriods[0];
	const end = windowPeriods[windowPeriods.length - 1];

	const rows = await db
		.select({
			period: transactions.period,
			transactionType: transactions.transactionType,
			totalAmount: sum(transactions.amount).as("total"),
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				gte(transactions.period, start),
				lte(transactions.period, end),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(transactions.period, transactions.transactionType);

	const totalsByPeriod = new Map<
		string,
		{ receitas: number; despesas: number }
	>();

	for (const key of windowPeriods) {
		totalsByPeriod.set(key, { receitas: 0, despesas: 0 });
	}

	for (const row of rows) {
		const key = row.period ?? undefined;
		if (!key || !totalsByPeriod.has(key)) continue;
		const bucket = totalsByPeriod.get(key);
		if (!bucket) continue;
		const total = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === DESPESA) {
			bucket.despesas += total;
		} else if (row.transactionType === RECEITA) {
			bucket.receitas += total;
		}
	}

	return windowPeriods.map((key) => ({
		period: key,
		label: formatCompactPeriodLabel(key),
		receitas: totalsByPeriod.get(key)?.receitas ?? 0,
		despesas: totalsByPeriod.get(key)?.despesas ?? 0,
	}));
}

export async function fetchPayerCardUsage({
	userId,
	payerId,
	period,
}: BaseFilters): Promise<PayerCardUsageItem[]> {
	const rows = await db
		.select({
			cardId: transactions.cardId,
			cardName: cards.name,
			cardLogo: cards.logo,
			totalAmount: sum(transactions.amount).as("total"),
		})
		.from(transactions)
		.innerJoin(cards, eq(transactions.cardId, cards.id))
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				eq(transactions.period, period),
				eq(transactions.paymentMethod, PAYMENT_METHOD_CARD),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(transactions.cardId, cards.name, cards.logo);

	const items: PayerCardUsageItem[] = [];

	for (const row of rows) {
		if (!row.cardId) {
			continue;
		}

		items.push({
			id: row.cardId,
			name: row.cardName ?? "Cartão",
			logo: row.cardLogo ?? null,
			amount: Math.abs(toNumber(row.totalAmount)),
		});
	}

	return items.sort((a, b) => b.amount - a.amount);
}

export async function fetchPayerBoletoStats({
	userId,
	payerId,
	period,
}: BaseFilters): Promise<PayerBoletoStats> {
	const rows = await db
		.select({
			isSettled: transactions.isSettled,
			totalAmount: sum(transactions.amount).as("total"),
			totalCount: sql<number>`count(${transactions.id})`.as("count"),
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				eq(transactions.period, period),
				eq(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(transactions.isSettled);

	let paidAmount = 0;
	let pendingAmount = 0;
	let paidCount = 0;
	let pendingCount = 0;

	for (const row of rows) {
		const total = Math.abs(toNumber(row.totalAmount));
		const count = toNumber(row.totalCount);
		if (row.isSettled) {
			paidAmount += total;
			paidCount += count;
		} else {
			pendingAmount += total;
			pendingCount += count;
		}
	}

	return {
		totalAmount: paidAmount + pendingAmount,
		paidAmount,
		pendingAmount,
		paidCount,
		pendingCount,
	};
}

export async function fetchPayerBoletoItems({
	userId,
	payerId,
	period,
}: BaseFilters): Promise<PayerBoletoItem[]> {
	const rows = await db
		.select({
			id: transactions.id,
			name: transactions.name,
			amount: transactions.amount,
			dueDate: transactions.dueDate,
			boletoPaymentDate: transactions.boletoPaymentDate,
			isSettled: transactions.isSettled,
			transactionType: transactions.transactionType,
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				eq(transactions.period, period),
				eq(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.orderBy(asc(transactions.dueDate));

	const items: PayerBoletoItem[] = [];

	for (const row of rows) {
		items.push({
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			dueDate: toDateOnlyString(row.dueDate),
			boletoPaymentDate: toDateOnlyString(row.boletoPaymentDate),
			isSettled: Boolean(row.isSettled),
			transactionType: row.transactionType,
		});
	}

	return items;
}

export async function fetchPayerPaymentStatus({
	userId,
	payerId,
	period,
}: BaseFilters): Promise<PayerPaymentStatusData> {
	const rows = await db
		.select({
			paidAmount: sql<string>`coalesce(sum(case when ${transactions.isSettled} = true then abs(${transactions.amount}) else 0 end), 0)`,
			paidCount: sql<number>`sum(case when ${transactions.isSettled} = true then 1 else 0 end)`,
			pendingAmount: sql<string>`coalesce(sum(case when (${transactions.isSettled} = false or ${transactions.isSettled} is null) then abs(${transactions.amount}) else 0 end), 0)`,
			pendingCount: sql<number>`sum(case when (${transactions.isSettled} = false or ${transactions.isSettled} is null) then 1 else 0 end)`,
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, payerId),
				eq(transactions.period, period),
				eq(transactions.transactionType, DESPESA),
				excludeAutoInvoiceEntries(),
				excludeTransactionsFromExcludedAccounts(),
			),
		);

	const row = rows[0];
	if (!row) {
		return {
			paidAmount: 0,
			paidCount: 0,
			pendingAmount: 0,
			pendingCount: 0,
			totalAmount: 0,
		};
	}

	const paidAmount = toNumber(row.paidAmount);
	const paidCount = toNumber(row.paidCount);
	const pendingAmount = toNumber(row.pendingAmount);
	const pendingCount = toNumber(row.pendingCount);

	return {
		paidAmount,
		paidCount,
		pendingAmount,
		pendingCount,
		totalAmount: paidAmount + pendingAmount,
	};
}
