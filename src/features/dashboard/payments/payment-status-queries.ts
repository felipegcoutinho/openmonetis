import { and, inArray, sql } from "drizzle-orm";
import { lancamentos } from "@/db/schema";
import {
	buildDashboardAdminPeriodFilters,
	excludeAutoInvoiceEntries,
} from "@/features/dashboard/lancamento-filters";
import { db } from "@/shared/lib/db";
import { getAdminPagadorId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";

export type PaymentStatusCategory = {
	total: number;
	confirmed: number;
	pending: number;
};

export type PaymentStatusData = {
	income: PaymentStatusCategory;
	expenses: PaymentStatusCategory;
};

const emptyCategory = (): PaymentStatusCategory => ({
	total: 0,
	confirmed: 0,
	pending: 0,
});

export async function fetchPaymentStatus(
	userId: string,
	period: string,
): Promise<PaymentStatusData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { income: emptyCategory(), expenses: emptyCategory() };
	}

	// Single query: GROUP BY transactionType instead of 2 separate queries
	const rows = await db
		.select({
			transactionType: lancamentos.transactionType,
			confirmed: sql<number>`
				coalesce(
					sum(case when ${lancamentos.isSettled} = true then ${lancamentos.amount} else 0 end),
					0
				)
			`,
			pending: sql<number>`
				coalesce(
					sum(case when ${lancamentos.isSettled} = false or ${lancamentos.isSettled} is null then ${lancamentos.amount} else 0 end),
					0
				)
			`,
		})
		.from(lancamentos)
		.where(
			and(
				...buildDashboardAdminPeriodFilters({
					userId,
					period,
					adminPagadorId,
				}),
				inArray(lancamentos.transactionType, ["Receita", "Despesa"]),
				excludeAutoInvoiceEntries(),
			),
		)
		.groupBy(lancamentos.transactionType);

	const result = { income: emptyCategory(), expenses: emptyCategory() };

	for (const row of rows) {
		const confirmed = toNumber(row.confirmed);
		const pending = toNumber(row.pending);
		const category = {
			total: confirmed + pending,
			confirmed,
			pending,
		};

		if (row.transactionType === "Receita") {
			result.income = category;
		} else if (row.transactionType === "Despesa") {
			result.expenses = category;
		}
	}

	return result;
}
