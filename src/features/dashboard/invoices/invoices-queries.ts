import { and, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm";
import { cards, invoices, payers, transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import {
	INVOICE_PAYMENT_STATUS,
	INVOICE_STATUS_VALUES,
	type InvoicePaymentStatus,
} from "@/shared/lib/invoices";
import {
	buildDateOnlyStringFromPeriodDay,
	compareDateOnly,
	getBusinessDateString,
	isDateOnlyPast,
	toDateOnlyString,
} from "@/shared/utils/date";
import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

type RawDashboardInvoice = {
	invoiceId: string | null;
	cardId: string;
	cardName: string;
	cardBrand: string | null;
	cardStatus: string | null;
	logo: string | null;
	dueDay: string;
	period: string | null;
	paymentStatus: string | null;
	totalAmount: string | number | null;
	transactionCount: string | number | null;
	invoiceCreatedAt: Date | null;
};

type RawInvoiceBreakdownRow = {
	cardId: string | null;
	period: string | null;
	payerId: string | null;
	pagadorName: string | null;
	pagadorAvatar: string | null;
	amount: number | string | null;
};

export type InvoicePagadorBreakdown = {
	payerId: string | null;
	pagadorName: string;
	pagadorAvatar: string | null;
	amount: number;
	percentageChange: number | null;
};

export type DashboardInvoice = {
	id: string;
	cardId: string;
	cardName: string;
	cardBrand: string | null;
	cardStatus: string | null;
	logo: string | null;
	dueDay: string;
	period: string;
	paymentStatus: InvoicePaymentStatus;
	totalAmount: number;
	paidAt: string | null;
	pagadorBreakdown: InvoicePagadorBreakdown[];
};

type DashboardInvoicesSnapshot = {
	invoices: DashboardInvoice[];
	totalPending: number;
};

const isInvoiceStatus = (value: unknown): value is InvoicePaymentStatus =>
	typeof value === "string" &&
	(INVOICE_STATUS_VALUES as string[]).includes(value);

const buildFallbackId = (cardId: string, period: string) =>
	`${cardId}:${period}`;

const compareDateOnlyAscWithNullsLast = (
	left: string | null,
	right: string | null,
) => {
	if (!left && !right) return 0;
	if (!left) return 1;
	if (!right) return -1;
	return compareDateOnly(left, right);
};

const compareDateOnlyDescWithNullsLast = (
	left: string | null,
	right: string | null,
) => {
	if (!left && !right) return 0;
	if (!left) return 1;
	if (!right) return -1;
	return compareDateOnly(right, left);
};

export async function fetchDashboardInvoices(
	userId: string,
	period: string,
): Promise<DashboardInvoicesSnapshot> {
	const today = getBusinessDateString();
	const previousPeriod = getPreviousPeriod(period);
	const paymentRows = await db
		.select({
			note: transactions.note,
			purchaseDate: transactions.purchaseDate,
			createdAt: transactions.createdAt,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				ilike(transactions.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`),
			),
		);

	const paymentMap = new Map<string, string>();
	for (const row of paymentRows) {
		const note = row.note;
		if (!note?.startsWith(ACCOUNT_AUTO_INVOICE_NOTE_PREFIX)) {
			continue;
		}
		const parts = note.split(":");
		if (parts.length < 3) {
			continue;
		}
		const cardIdPart = parts[1];
		const periodPart = parts[2];
		if (!cardIdPart || !periodPart) {
			continue;
		}
		const key = `${cardIdPart}:${periodPart}`;
		const resolvedDate =
			row.purchaseDate instanceof Date &&
			!Number.isNaN(row.purchaseDate.valueOf())
				? row.purchaseDate
				: row.createdAt;
		const isoDate = toDateOnlyString(resolvedDate);
		if (!isoDate) {
			continue;
		}
		const existing = paymentMap.get(key);
		if (!existing || existing < isoDate) {
			paymentMap.set(key, isoDate);
		}
	}

	const [rows, breakdownRows] = (await Promise.all([
		db
			.select({
				invoiceId: invoices.id,
				cardId: cards.id,
				cardName: cards.name,
				logo: cards.logo,
				dueDay: cards.dueDay,
				period: invoices.period,
				paymentStatus: invoices.paymentStatus,
				invoiceCreatedAt: invoices.createdAt,
				totalAmount: sql<number | null>`
        COALESCE(SUM(${transactions.amount}), 0)
      `,
				transactionCount: sql<number | null>`COUNT(${transactions.id})`,
			})
			.from(cards)
			.leftJoin(
				invoices,
				and(
					eq(invoices.cardId, cards.id),
					eq(invoices.userId, userId),
					eq(invoices.period, period),
				),
			)
			.leftJoin(
				transactions,
				and(
					eq(transactions.cardId, cards.id),
					eq(transactions.userId, userId),
					eq(transactions.period, period),
				),
			)
			.where(eq(cards.userId, userId))
			.groupBy(
				invoices.id,
				cards.id,
				cards.name,
				cards.brand,
				cards.status,
				cards.logo,
				cards.dueDay,
				invoices.period,
				invoices.paymentStatus,
			),
		db
			.select({
				cardId: transactions.cardId,
				period: transactions.period,
				payerId: transactions.payerId,
				pagadorName: payers.name,
				pagadorAvatar: payers.avatarUrl,
				amount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.leftJoin(payers, eq(transactions.payerId, payers.id))
			.where(
				and(
					eq(transactions.userId, userId),
					inArray(transactions.period, [period, previousPeriod]),
					isNotNull(transactions.cardId),
				),
			)
			.groupBy(
				transactions.cardId,
				transactions.period,
				transactions.payerId,
				payers.name,
				payers.avatarUrl,
			),
	])) as [RawDashboardInvoice[], RawInvoiceBreakdownRow[]];

	const groupedBreakdown = new Map<
		string,
		{
			cardId: string;
			payerId: string | null;
			pagadorName: string;
			pagadorAvatar: string | null;
			currentAmount: number;
			previousAmount: number;
		}
	>();

	for (const row of breakdownRows) {
		if (!row.cardId) {
			continue;
		}

		const resolvedPeriod = row.period ?? period;
		const amount = Math.abs(toNumber(row.amount));
		if (amount <= 0) {
			continue;
		}

		const payerId = row.payerId ?? null;
		const pagadorName = row.pagadorName?.trim() || "Sem pagador";
		const pagadorAvatar = row.pagadorAvatar ?? null;
		const payerKey = payerId ?? "__without-payer__";
		const key = `${row.cardId}:${payerKey}`;
		const current = groupedBreakdown.get(key) ?? {
			cardId: row.cardId,
			payerId,
			pagadorName,
			pagadorAvatar,
			currentAmount: 0,
			previousAmount: 0,
		};

		if (resolvedPeriod === period) {
			current.payerId = payerId;
			current.pagadorName = pagadorName;
			current.pagadorAvatar = pagadorAvatar;
			current.currentAmount = amount;
		}

		if (resolvedPeriod === previousPeriod) {
			current.previousAmount = amount;
		}

		groupedBreakdown.set(key, current);
	}

	const breakdownMap = new Map<string, InvoicePagadorBreakdown[]>();
	for (const share of groupedBreakdown.values()) {
		if (share.currentAmount <= 0) {
			continue;
		}

		const key = `${share.cardId}:${period}`;
		const current = breakdownMap.get(key) ?? [];
		current.push({
			payerId: share.payerId,
			pagadorName: share.pagadorName,
			pagadorAvatar: share.pagadorAvatar,
			amount: share.currentAmount,
			percentageChange: calculatePercentageChange(
				share.currentAmount,
				share.previousAmount,
			),
		});
		breakdownMap.set(key, current);
	}

	const invoiceList: DashboardInvoice[] = [];

	for (const row of rows) {
		if (!row) {
			continue;
		}

		const totalAmount = toNumber(row.totalAmount);
		const transactionCount = toNumber(row.transactionCount);
		const paymentStatus = isInvoiceStatus(row.paymentStatus)
			? row.paymentStatus
			: INVOICE_PAYMENT_STATUS.PENDING;

		const shouldInclude =
			transactionCount > 0 ||
			Math.abs(totalAmount) > 0 ||
			row.invoiceId !== null;

		if (!shouldInclude) {
			continue;
		}

		const resolvedPeriod = row.period ?? period;
		const paymentKey = `${row.cardId}:${resolvedPeriod}`;
		const paidAt =
			paymentStatus === INVOICE_PAYMENT_STATUS.PAID
				? (paymentMap.get(paymentKey) ?? toDateOnlyString(row.invoiceCreatedAt))
				: null;

		invoiceList.push({
			id: row.invoiceId ?? buildFallbackId(row.cardId, period),
			cardId: row.cardId,
			cardName: row.cardName,
			cardBrand: row.cardBrand,
			cardStatus: row.cardStatus,
			logo: row.logo,
			dueDay: row.dueDay,
			period: resolvedPeriod,
			paymentStatus,
			totalAmount,
			paidAt,
			pagadorBreakdown: (
				breakdownMap.get(`${row.cardId}:${resolvedPeriod}`) ?? []
			).sort((a, b) => b.amount - a.amount),
		});
	}

	invoiceList.sort((a, b) => {
		const aIsPending = a.paymentStatus === INVOICE_PAYMENT_STATUS.PENDING;
		const bIsPending = b.paymentStatus === INVOICE_PAYMENT_STATUS.PENDING;
		if (aIsPending !== bIsPending) {
			return aIsPending ? -1 : 1;
		}

		if (aIsPending && bIsPending) {
			const aDueDate = buildDateOnlyStringFromPeriodDay(a.period, a.dueDay);
			const bDueDate = buildDateOnlyStringFromPeriodDay(b.period, b.dueDay);
			const aIsOverdue = aDueDate ? isDateOnlyPast(aDueDate, today) : false;
			const bIsOverdue = bDueDate ? isDateOnlyPast(bDueDate, today) : false;

			if (aIsOverdue !== bIsOverdue) {
				return aIsOverdue ? -1 : 1;
			}

			const dueDateDiff = compareDateOnlyAscWithNullsLast(aDueDate, bDueDate);
			if (dueDateDiff !== 0) {
				return dueDateDiff;
			}

			const amountDiff = Math.abs(b.totalAmount) - Math.abs(a.totalAmount);
			if (amountDiff !== 0) {
				return amountDiff;
			}
		}

		if (!aIsPending && !bIsPending) {
			const paidAtDiff = compareDateOnlyDescWithNullsLast(a.paidAt, b.paidAt);
			if (paidAtDiff !== 0) {
				return paidAtDiff;
			}

			const amountDiff = Math.abs(b.totalAmount) - Math.abs(a.totalAmount);
			if (amountDiff !== 0) {
				return amountDiff;
			}
		}

		const nameDiff = a.cardName.localeCompare(b.cardName, "pt-BR", {
			sensitivity: "base",
		});
		if (nameDiff !== 0) {
			return nameDiff;
		}

		return a.id.localeCompare(b.id);
	});

	const totalPending = invoiceList.reduce((total, invoice) => {
		if (invoice.paymentStatus !== INVOICE_PAYMENT_STATUS.PENDING) {
			return total;
		}
		return total + invoice.totalAmount;
	}, 0);

	return {
		invoices: invoiceList,
		totalPending,
	};
}
