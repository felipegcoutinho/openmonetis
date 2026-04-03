import { and, eq, inArray, sql } from "drizzle-orm";
import {
	budgets,
	categories,
	financialAccounts,
	transactions,
} from "@/db/schema";
import {
	buildCategoryBreakdownData,
	type DashboardCategoryBreakdownData,
	type DashboardCategoryBreakdownItem,
} from "@/features/dashboard/categories/category-breakdown";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeTransactionsFromExcludedAccounts,
} from "@/features/dashboard/transaction-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { getPreviousPeriod } from "@/shared/utils/period";

export type CategoryExpenseItem = DashboardCategoryBreakdownItem;
export type ExpensesByCategoryData = DashboardCategoryBreakdownData;

export async function fetchExpensesByCategory(
	userId: string,
	period: string,
): Promise<ExpensesByCategoryData> {
	const previousPeriod = getPreviousPeriod(period);

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { categories: [], currentTotal: 0, previousTotal: 0 };
	}

	// Single query: GROUP BY categoryId + period for both current and previous periods
	const [rows, budgetRows] = await Promise.all([
		db
			.select({
				categoryId: categories.id,
				categoryName: categories.name,
				categoryIcon: categories.icon,
				period: transactions.period,
				total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.innerJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					...buildDashboardAdminFilters({ userId, adminPayerId }),
					inArray(transactions.period, [period, previousPeriod]),
					eq(transactions.transactionType, "Despesa"),
					eq(categories.type, "despesa"),
					excludeAutoInvoiceEntries(),
					excludeTransactionsFromExcludedAccounts(),
				),
			)
			.groupBy(
				categories.id,
				categories.name,
				categories.icon,
				transactions.period,
			),
		db
			.select({
				categoryId: budgets.categoryId,
				amount: budgets.amount,
			})
			.from(budgets)
			.where(and(eq(budgets.userId, userId), eq(budgets.period, period))),
	]);

	return buildCategoryBreakdownData({
		rows,
		budgetRows,
		period,
	});
}
