import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type RecurringExpense = {
	id: string;
	name: string;
	amount: number;
	paymentMethod: string;
	recurrenceCount: number | null;
};

export type RecurringExpensesData = {
	expenses: RecurringExpense[];
};

export async function fetchRecurringExpenses(
	userId: string,
	period: string,
): Promise<RecurringExpensesData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { expenses: [] };
	}

	const results = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			paymentMethod: lancamentos.paymentMethod,
			recurrenceCount: lancamentos.recurrenceCount,
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(lancamentos.condition, "Recorrente"),
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

	const expenses = results.map(
		(row): RecurringExpense => ({
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			paymentMethod: row.paymentMethod,
			recurrenceCount: row.recurrenceCount,
		}),
	);

	return {
		expenses,
	};
}
