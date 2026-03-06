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

const toISODate = (value: Date | string | null | undefined): string | null => {
	if (!value) return null;
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return typeof value === "string" ? value : null;
};

const toNumber = (value: string | number | bigint | null) => {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "bigint") {
		return Number(value);
	}
	if (!value) {
		return 0;
	}
	const parsed = Number(value);
	return Number.isNaN(parsed) ? 0 : parsed;
};

const formatPeriod = (year: number, month: number) =>
	`${year}-${String(month).padStart(2, "0")}`;

const normalizePeriod = (period: string) => {
	const [yearStr, monthStr] = period.split("-");
	const year = Number.parseInt(yearStr ?? "", 10);
	const month = Number.parseInt(monthStr ?? "", 10);
	if (Number.isNaN(year) || Number.isNaN(month)) {
		throw new Error(`Período inválido: ${period}`);
	}
	return { year, month };
};

const buildPeriodWindow = (period: string, months: number) => {
	const { year, month } = normalizePeriod(period);
	const items: string[] = [];
	let currentYear = year;
	let currentMonth = month;

	for (let i = 0; i < months; i += 1) {
		items.unshift(formatPeriod(currentYear, currentMonth));
		currentMonth -= 1;
		if (currentMonth < 1) {
			currentMonth = 12;
			currentYear -= 1;
		}
	}

	return items;
};

const formatPeriodLabel = (period: string) => {
	try {
		const { year, month } = normalizePeriod(period);
		const formatter = new Intl.DateTimeFormat("pt-BR", {
			month: "short",
		});
		const date = new Date(year, month - 1, 1);
		const rawLabel = formatter.format(date).replace(".", "");
		const label =
			rawLabel.length > 0
				? rawLabel.charAt(0).toUpperCase().concat(rawLabel.slice(1))
				: rawLabel;
		const suffix = String(year).slice(-2);
		return `${label}/${suffix}`;
	} catch {
		return period;
	}
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
	const window = buildPeriodWindow(period, months);
	const start = window[0];
	const end = window[window.length - 1];

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

	for (const key of window) {
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

	return window.map((key) => ({
		period: key,
		label: formatPeriodLabel(key),
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

	return rows
		.filter((row) => Boolean(row.cartaoId))
		.map((row) => {
			if (!row.cartaoId) {
				throw new Error("cartaoId should not be null after filter");
			}
			return {
				id: row.cartaoId,
				name: row.cardName ?? "Cartão",
				logo: row.cardLogo ?? null,
				amount: Math.abs(toNumber(row.totalAmount)),
			};
		})
		.sort((a, b) => b.amount - a.amount);
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

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		amount: Math.abs(toNumber(row.amount)),
		dueDate: toISODate(row.dueDate),
		boletoPaymentDate: toISODate(row.boletoPaymentDate),
		isSettled: Boolean(row.isSettled),
	}));
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
