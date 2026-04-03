import { and, eq, inArray, or, sql } from "drizzle-orm";
import {
	budgets,
	categories,
	financialAccounts,
	transactions,
} from "@/db/schema";
import {
	buildCategoryBreakdownData,
	type DashboardCategoryBreakdownData,
} from "@/features/dashboard/categories/category-breakdown";
import type { ExpensesByCategoryData } from "@/features/dashboard/categories/expenses-by-category-queries";
import type { IncomeByCategoryData } from "@/features/dashboard/categories/income-by-category-queries";
import type {
	GoalProgressCategory,
	GoalProgressItem,
	GoalsProgressData,
} from "@/features/dashboard/goals-progress-queries";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
	excludeTransactionsFromExcludedAccounts,
} from "@/features/dashboard/transaction-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

const BUDGET_CRITICAL_THRESHOLD = 80;

type CategorySnapshotRow = {
	categoryId: string;
	categoryName: string;
	categoryIcon: string | null;
	categoryType: string | null;
	period: string | null;
	condition: string;
	total: number;
	absoluteTotal: number;
};

type BudgetSnapshotRow = {
	budgetId: string;
	categoryId: string | null;
	categoryName: string;
	categoryIcon: string | null;
	period: string;
	createdAt: Date;
	amount: string | number | null;
};

export type DashboardCategoryOverview = {
	goalsProgressData: GoalsProgressData;
	incomeByCategoryData: IncomeByCategoryData;
	expensesByCategoryData: ExpensesByCategoryData;
};

const resolveStatus = (usedPercentage: number): GoalProgressItem["status"] => {
	if (usedPercentage >= 100) {
		return "exceeded";
	}

	if (usedPercentage >= BUDGET_CRITICAL_THRESHOLD) {
		return "critical";
	}

	return "on-track";
};

const emptyOverview = (): DashboardCategoryOverview => ({
	goalsProgressData: {
		items: [],
		categories: [],
		totalBudgets: 0,
		exceededCount: 0,
		criticalCount: 0,
	},
	incomeByCategoryData: {
		categories: [],
		currentTotal: 0,
		previousTotal: 0,
	},
	expensesByCategoryData: {
		categories: [],
		currentTotal: 0,
		previousTotal: 0,
	},
});

const aggregateCategoryRows = (
	rows: CategorySnapshotRow[],
	categoryType: "receita" | "despesa",
) => {
	const grouped = new Map<
		string,
		{
			categoryId: string;
			categoryName: string;
			categoryIcon: string | null;
			period: string | null;
			total: number;
		}
	>();

	for (const row of rows) {
		if (row.categoryType !== categoryType) {
			continue;
		}

		const key = `${row.categoryId}:${row.period ?? "sem-periodo"}`;
		const current = grouped.get(key) ?? {
			categoryId: row.categoryId,
			categoryName: row.categoryName,
			categoryIcon: row.categoryIcon,
			period: row.period,
			total: 0,
		};

		current.total += toNumber(row.total);
		grouped.set(key, current);
	}

	return Array.from(grouped.values());
};

export async function fetchDashboardCategoryOverview(
	userId: string,
	period: string,
): Promise<DashboardCategoryOverview> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return emptyOverview();
	}

	const previousPeriod = getPreviousPeriod(period);

	const [transactionRows, budgetRows, categoryRows] = await Promise.all([
		db
			.select({
				categoryId: categories.id,
				categoryName: categories.name,
				categoryIcon: categories.icon,
				categoryType: categories.type,
				period: transactions.period,
				condition: transactions.condition,
				total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
				absoluteTotal: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
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
					excludeTransactionsFromExcludedAccounts(),
					or(
						and(
							eq(transactions.transactionType, "Despesa"),
							eq(categories.type, "despesa"),
							excludeAutoInvoiceEntries(),
						),
						and(
							eq(transactions.transactionType, "Receita"),
							eq(categories.type, "receita"),
							excludeAutoInvoiceEntries(),
							excludeInitialBalanceWhenConfigured(),
						),
					),
				),
			)
			.groupBy(
				categories.id,
				categories.name,
				categories.icon,
				categories.type,
				transactions.period,
				transactions.condition,
			),
		db
			.select({
				budgetId: budgets.id,
				categoryId: budgets.categoryId,
				categoryName: categories.name,
				categoryIcon: categories.icon,
				period: budgets.period,
				createdAt: budgets.createdAt,
				amount: budgets.amount,
			})
			.from(budgets)
			.innerJoin(categories, eq(budgets.categoryId, categories.id))
			.where(and(eq(budgets.userId, userId), eq(budgets.period, period))),
		db.query.categories.findMany({
			where: and(eq(categories.userId, userId), eq(categories.type, "despesa")),
			orderBy: (category, { asc }) => [asc(category.name)],
		}),
	]);

	const snapshotRows = transactionRows as CategorySnapshotRow[];
	const incomeRows = aggregateCategoryRows(snapshotRows, "receita");
	const expenseRows = aggregateCategoryRows(snapshotRows, "despesa");
	const budgetAmountRows = (budgetRows as BudgetSnapshotRow[]).map((row) => ({
		categoryId: row.categoryId,
		amount: row.amount,
	}));

	const incomeByCategoryData: DashboardCategoryBreakdownData =
		buildCategoryBreakdownData({
			rows: incomeRows,
			budgetRows: budgetAmountRows,
			period,
		});
	const expensesByCategoryData: DashboardCategoryBreakdownData =
		buildCategoryBreakdownData({
			rows: expenseRows,
			budgetRows: budgetAmountRows,
			period,
		});

	const currentExpenseMap = new Map<string, number>();
	for (const row of snapshotRows) {
		if (
			row.categoryType === "despesa" &&
			row.period === period &&
			row.condition !== "cancelado"
		) {
			currentExpenseMap.set(
				row.categoryId,
				(currentExpenseMap.get(row.categoryId) ?? 0) +
					toNumber(row.absoluteTotal),
			);
		}
	}

	const goalsCategories: GoalProgressCategory[] = categoryRows.map(
		(category) => ({
			id: category.id,
			name: category.name,
			icon: category.icon,
		}),
	);

	const goalItems: GoalProgressItem[] = (budgetRows as BudgetSnapshotRow[])
		.map((row) => {
			const budgetAmount = toNumber(row.amount);
			const spentAmount = row.categoryId
				? (currentExpenseMap.get(row.categoryId) ?? 0)
				: 0;
			const usedPercentage =
				budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

			return {
				id: row.budgetId,
				categoryId: row.categoryId,
				categoryName: row.categoryName,
				categoryIcon: row.categoryIcon,
				period: row.period,
				createdAt: row.createdAt.toISOString(),
				budgetAmount,
				spentAmount,
				usedPercentage,
				status: resolveStatus(usedPercentage),
			};
		})
		.sort((a, b) => b.usedPercentage - a.usedPercentage);

	const exceededCount = goalItems.filter(
		(item) => item.status === "exceeded",
	).length;
	const criticalCount = goalItems.filter(
		(item) => item.status === "critical",
	).length;

	return {
		goalsProgressData: {
			items: goalItems,
			categories: goalsCategories,
			totalBudgets: goalItems.length,
			exceededCount,
			criticalCount,
		},
		incomeByCategoryData,
		expensesByCategoryData,
	};
}
