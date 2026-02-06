"use server";

import { and, asc, eq } from "drizzle-orm";
import { lancamentos } from "@/db/schema";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

const PAYMENT_METHOD_BOLETO = "Boleto";

type RawDashboardBoleto = {
	id: string;
	name: string;
	amount: string | number | null;
	dueDate: string | Date | null;
	boletoPaymentDate: string | Date | null;
	isSettled: boolean | null;
};

export type DashboardBoleto = {
	id: string;
	name: string;
	amount: number;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	isSettled: boolean;
};

export type DashboardBoletosSnapshot = {
	boletos: DashboardBoleto[];
	totalPendingAmount: number;
	pendingCount: number;
};

const toISODate = (value: Date | string | null) => {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}

	if (typeof value === "string") {
		return value;
	}

	return null;
};

export async function fetchDashboardBoletos(
	userId: string,
	period: string,
): Promise<DashboardBoletosSnapshot> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { boletos: [], totalPendingAmount: 0, pendingCount: 0 };
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

	const boletos = rows.map((row: RawDashboardBoleto): DashboardBoleto => {
		const amount = Math.abs(toNumber(row.amount));
		return {
			id: row.id,
			name: row.name,
			amount,
			dueDate: toISODate(row.dueDate),
			boletoPaymentDate: toISODate(row.boletoPaymentDate),
			isSettled: Boolean(row.isSettled),
		};
	});

	let totalPendingAmount = 0;
	let pendingCount = 0;

	for (const boleto of boletos) {
		if (!boleto.isSettled) {
			totalPendingAmount += boleto.amount;
			pendingCount += 1;
		}
	}

	return {
		boletos,
		totalPendingAmount,
		pendingCount,
	};
}
