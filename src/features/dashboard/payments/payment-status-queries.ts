import { and, eq, inArray, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import {
	buildDashboardAdminPeriodFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
	excludeTransactionsFromExcludedAccounts,
} from "@/features/dashboard/transaction-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
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
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { income: emptyCategory(), expenses: emptyCategory() };
	}

	// Single query: GROUP BY transactionType instead of 2 separate queries
	const rows = await db
		.select({
			transactionType: transactions.transactionType,
			confirmed: sql<number>`
				coalesce(
					sum(case when ${transactions.isSettled} = true then ${transactions.amount} else 0 end),
					0
				)
			`,
			pending: sql<number>`
				coalesce(
					sum(case when ${transactions.isSettled} = false or ${transactions.isSettled} is null then ${transactions.amount} else 0 end),
					0
				)
			`,
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				...buildDashboardAdminPeriodFilters({
					userId,
					period,
					adminPayerId,
				}),
				inArray(transactions.transactionType, ["Receita", "Despesa"]),
				excludeAutoInvoiceEntries(),
				excludeInitialBalanceWhenConfigured(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(transactions.transactionType);

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
