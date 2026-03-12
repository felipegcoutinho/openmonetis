"use server";

import { and, asc, eq } from "drizzle-orm";
import { lancamentos } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPagadorId } from "@/shared/lib/payers/get-admin-id";
import { toDateOnlyString } from "@/shared/utils/date";
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

export async function fetchDashboardBills(
	userId: string,
	period: string,
): Promise<DashboardBillsSnapshot> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { bills: [], totalPendingAmount: 0, pendingCount: 0 };
	}

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
				eq(lancamentos.period, period),
				eq(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
				eq(lancamentos.pagadorId, adminPagadorId),
			),
		)
		.orderBy(
			asc(lancamentos.isSettled),
			asc(lancamentos.dueDate),
			asc(lancamentos.name),
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
