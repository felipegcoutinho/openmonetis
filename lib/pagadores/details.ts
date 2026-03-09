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
import { cartoes, lancamentos } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/contas/constants";
import { db } from "@/lib/db";
import { toDateOnlyString } from "@/lib/utils/date";
import { safeToNumber as toNumber } from "@/lib/utils/number";
import {
	addMonthsToPeriod,
	buildPeriodRange,
	formatCompactPeriodLabel,
} from "@/lib/utils/period";

const RECEITA = "Receita";
const DESPESA = "Despesa";
const PAYMENT_METHOD_CARD = "Cartão de crédito";
const PAYMENT_METHOD_BOLETO = "Boleto";

export type PagadorMonthlyBreakdown = {
	totalExpenses: number;
	totalIncomes: number;
	paymentSplits: Record<"card" | "boleto" | "instant", number>;
};

export type PagadorHistoryPoint = {
	period: string;
	label: string;
	receitas: number;
	despesas: number;
};

export type PagadorCardUsageItem = {
	id: string;
	name: string;
	logo: string | null;
	amount: number;
};

export type PagadorBoletoStats = {
	totalAmount: number;
	paidAmount: number;
	pendingAmount: number;
	paidCount: number;
	pendingCount: number;
};

export type PagadorBoletoItem = {
	id: string;
	name: string;
	amount: number;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	isSettled: boolean;
};

export type PagadorPaymentStatusData = {
	paidAmount: number;
	paidCount: number;
	pendingAmount: number;
	pendingCount: number;
	totalAmount: number;
};

const excludeAutoInvoiceEntries = () =>
	or(
		isNull(lancamentos.note),
		not(ilike(lancamentos.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
	);

type BaseFilters = {
	userId: string;
	pagadorId: string;
	period: string;
};

export async function fetchPagadorMonthlyBreakdown({
	userId,
	pagadorId,
	period,
}: BaseFilters): Promise<PagadorMonthlyBreakdown> {
	const rows = await db
		.select({
			paymentMethod: lancamentos.paymentMethod,
			transactionType: lancamentos.transactionType,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				eq(lancamentos.period, period),
				excludeAutoInvoiceEntries(),
			),
		)
		.groupBy(lancamentos.paymentMethod, lancamentos.transactionType);

	const paymentSplits: PagadorMonthlyBreakdown["paymentSplits"] = {
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

export async function fetchPagadorHistory({
	userId,
	pagadorId,
	period,
	months = 6,
}: BaseFilters & { months?: number }): Promise<PagadorHistoryPoint[]> {
	const startPeriod = addMonthsToPeriod(period, -(Math.max(months, 1) - 1));
	const windowPeriods = buildPeriodRange(startPeriod, period);
	const start = windowPeriods[0];
	const end = windowPeriods[windowPeriods.length - 1];

	const rows = await db
		.select({
			period: lancamentos.period,
			transactionType: lancamentos.transactionType,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				gte(lancamentos.period, start),
				lte(lancamentos.period, end),
				excludeAutoInvoiceEntries(),
			),
		)
		.groupBy(lancamentos.period, lancamentos.transactionType);

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

export async function fetchPagadorCardUsage({
	userId,
	pagadorId,
	period,
}: BaseFilters): Promise<PagadorCardUsageItem[]> {
	const rows = await db
		.select({
			cartaoId: lancamentos.cartaoId,
			cardName: cartoes.name,
			cardLogo: cartoes.logo,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				eq(lancamentos.period, period),
				eq(lancamentos.paymentMethod, PAYMENT_METHOD_CARD),
				excludeAutoInvoiceEntries(),
			),
		)
		.groupBy(lancamentos.cartaoId, cartoes.name, cartoes.logo);

	const items: PagadorCardUsageItem[] = [];

	for (const row of rows) {
		if (!row.cartaoId) {
			continue;
		}

		items.push({
			id: row.cartaoId,
			name: row.cardName ?? "Cartão",
			logo: row.cardLogo ?? null,
			amount: Math.abs(toNumber(row.totalAmount)),
		});
	}

	return items.sort((a, b) => b.amount - a.amount);
}

export async function fetchPagadorBoletoStats({
	userId,
	pagadorId,
	period,
}: BaseFilters): Promise<PagadorBoletoStats> {
	const rows = await db
		.select({
			isSettled: lancamentos.isSettled,
			totalAmount: sum(lancamentos.amount).as("total"),
			totalCount: sql<number>`count(${lancamentos.id})`.as("count"),
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				eq(lancamentos.period, period),
				eq(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
				excludeAutoInvoiceEntries(),
			),
		)
		.groupBy(lancamentos.isSettled);

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

export async function fetchPagadorBoletoItems({
	userId,
	pagadorId,
	period,
}: BaseFilters): Promise<PagadorBoletoItem[]> {
	const rows = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			dueDate: lancamentos.dueDate,
			boletoPaymentDate: lancamentos.boletoPaymentDate,
			isSettled: lancamentos.isSettled,
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				eq(lancamentos.period, period),
				eq(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
				excludeAutoInvoiceEntries(),
			),
		)
		.orderBy(asc(lancamentos.dueDate));

	const items: PagadorBoletoItem[] = [];

	for (const row of rows) {
		items.push({
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			dueDate: toDateOnlyString(row.dueDate),
			boletoPaymentDate: toDateOnlyString(row.boletoPaymentDate),
			isSettled: Boolean(row.isSettled),
		});
	}

	return items;
}

export async function fetchPagadorPaymentStatus({
	userId,
	pagadorId,
	period,
}: BaseFilters): Promise<PagadorPaymentStatusData> {
	const rows = await db
		.select({
			paidAmount: sql<string>`coalesce(sum(case when ${lancamentos.isSettled} = true then abs(${lancamentos.amount}) else 0 end), 0)`,
			paidCount: sql<number>`sum(case when ${lancamentos.isSettled} = true then 1 else 0 end)`,
			pendingAmount: sql<string>`coalesce(sum(case when (${lancamentos.isSettled} = false or ${lancamentos.isSettled} is null) then abs(${lancamentos.amount}) else 0 end), 0)`,
			pendingCount: sql<number>`sum(case when (${lancamentos.isSettled} = false or ${lancamentos.isSettled} is null) then 1 else 0 end)`,
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, pagadorId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, DESPESA),
				excludeAutoInvoiceEntries(),
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
