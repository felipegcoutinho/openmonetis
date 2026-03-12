import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPagadorId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";

export type InstallmentExpense = {
	id: string;
	name: string;
	amount: number;
	paymentMethod: string;
	currentInstallment: number | null;
	installmentCount: number | null;
	dueDate: Date | null;
	purchaseDate: Date;
	period: string;
};

export type InstallmentExpensesData = {
	expenses: InstallmentExpense[];
};

export async function fetchInstallmentExpenses(
	userId: string,
	period: string,
): Promise<InstallmentExpensesData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { expenses: [] };
	}

	const rows = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			paymentMethod: lancamentos.paymentMethod,
			currentInstallment: lancamentos.currentInstallment,
			installmentCount: lancamentos.installmentCount,
			dueDate: lancamentos.dueDate,
			purchaseDate: lancamentos.purchaseDate,
			period: lancamentos.period,
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(lancamentos.condition, "Parcelado"),
				eq(lancamentos.isAnticipated, false),
				eq(lancamentos.pagadorId, adminPagadorId),
				or(
					isNull(lancamentos.note),
					and(
						sql`${lancamentos.note} != ${INITIAL_BALANCE_NOTE}`,
						sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			),
		)
		.orderBy(desc(lancamentos.purchaseDate), desc(lancamentos.createdAt));

	type InstallmentExpenseRow = (typeof rows)[number];

	const expenses = rows
		.map(
			(row: InstallmentExpenseRow): InstallmentExpense => ({
				id: row.id,
				name: row.name,
				amount: Math.abs(toNumber(row.amount)),
				paymentMethod: row.paymentMethod,
				currentInstallment: row.currentInstallment,
				installmentCount: row.installmentCount,
				dueDate: row.dueDate ?? null,
				purchaseDate: row.purchaseDate,
				period: row.period,
			}),
		)
		.sort((a: InstallmentExpense, b: InstallmentExpense) => {
			// Calcula parcelas restantes para cada item
			const remainingA =
				a.installmentCount && a.currentInstallment
					? a.installmentCount - a.currentInstallment
					: 0;
			const remainingB =
				b.installmentCount && b.currentInstallment
					? b.installmentCount - b.currentInstallment
					: 0;

			// Ordena do menor número de parcelas restantes para o maior
			return remainingA - remainingB;
		});

	return { expenses };
}
