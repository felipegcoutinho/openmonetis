"use server";

import { and, eq } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import {
	compareDateOnly,
	getBusinessDateString,
	isDateOnlyPast,
	toDateOnlyString,
} from "@/shared/utils/date";
import { safeToNumber as toNumber } from "@/shared/utils/number";

const PAYMENT_METHOD_BOLETO = "Boleto";

type RawDashboardBill = {
	id: string;
	name: string;
	amount: string | number | null;
	dueDate: string | Date | null;
	boletoPaymentDate: string | Date | null;
	isSettled: boolean | null;
};

export type DashboardBill = {
	id: string;
	name: string;
	amount: number;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	isSettled: boolean;
};

export type DashboardBillsSnapshot = {
	bills: DashboardBill[];
	totalPendingAmount: number;
	pendingCount: number;
};

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

export async function fetchDashboardBills(
	userId: string,
	period: string,
): Promise<DashboardBillsSnapshot> {
	const today = getBusinessDateString();
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { bills: [], totalPendingAmount: 0, pendingCount: 0 };
	}

	const rows = await db
		.select({
			id: transactions.id,
			name: transactions.name,
			amount: transactions.amount,
			dueDate: transactions.dueDate,
			boletoPaymentDate: transactions.boletoPaymentDate,
			isSettled: transactions.isSettled,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.period, period),
				eq(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
				eq(transactions.payerId, adminPayerId),
			),
		);

	const bills = rows.map((row: RawDashboardBill): DashboardBill => {
		const amount = Math.abs(toNumber(row.amount));
		return {
			id: row.id,
			name: row.name,
			amount,
			dueDate: toDateOnlyString(row.dueDate),
			boletoPaymentDate: toDateOnlyString(row.boletoPaymentDate),
			isSettled: Boolean(row.isSettled),
		};
	});

	bills.sort((a, b) => {
		if (a.isSettled !== b.isSettled) {
			return a.isSettled ? 1 : -1;
		}

		if (!a.isSettled && !b.isSettled) {
			const aIsOverdue = a.dueDate ? isDateOnlyPast(a.dueDate, today) : false;
			const bIsOverdue = b.dueDate ? isDateOnlyPast(b.dueDate, today) : false;

			if (aIsOverdue !== bIsOverdue) {
				return aIsOverdue ? -1 : 1;
			}

			const dueDateDiff = compareDateOnlyAscWithNullsLast(a.dueDate, b.dueDate);
			if (dueDateDiff !== 0) {
				return dueDateDiff;
			}

			const amountDiff = b.amount - a.amount;
			if (amountDiff !== 0) {
				return amountDiff;
			}
		}

		if (a.isSettled && b.isSettled) {
			const paidAtDiff = compareDateOnlyDescWithNullsLast(
				a.boletoPaymentDate,
				b.boletoPaymentDate,
			);
			if (paidAtDiff !== 0) {
				return paidAtDiff;
			}

			const amountDiff = b.amount - a.amount;
			if (amountDiff !== 0) {
				return amountDiff;
			}
		}

		const nameDiff = a.name.localeCompare(b.name, "pt-BR", {
			sensitivity: "base",
		});
		if (nameDiff !== 0) {
			return nameDiff;
		}

		return a.id.localeCompare(b.id);
	});

	let totalPendingAmount = 0;
	let pendingCount = 0;

	for (const bill of bills) {
		if (!bill.isSettled) {
			totalPendingAmount += bill.amount;
			pendingCount += 1;
		}
	}

	return {
		bills,
		totalPendingAmount,
		pendingCount,
	};
}
