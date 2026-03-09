import { and, eq, inArray, sql } from "drizzle-orm";
import { categorias, lancamentos, orcamentos } from "@/db/schema";
import {
	buildCategoryBreakdownData,
	type DashboardCategoryBreakdownData,
	type DashboardCategoryBreakdownItem,
} from "@/lib/dashboard/categories/category-breakdown";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
} from "@/lib/dashboard/lancamento-filters";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
import { getPreviousPeriod } from "@/lib/utils/period";

export type CategoryExpenseItem = DashboardCategoryBreakdownItem;
export type ExpensesByCategoryData = DashboardCategoryBreakdownData;

export async function fetchExpensesByCategory(
	userId: string,
	period: string,
): Promise<ExpensesByCategoryData> {
	const previousPeriod = getPreviousPeriod(period);

	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { categories: [], currentTotal: 0, previousTotal: 0 };
	}

	// Single query: GROUP BY categoriaId + period for both current and previous periods
	const [rows, budgetRows] = await Promise.all([
		db
			.select({
				categoryId: categorias.id,
				categoryName: categorias.name,
				categoryIcon: categorias.icon,
				period: lancamentos.period,
				total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
			.where(
				and(
					...buildDashboardAdminFilters({ userId, adminPagadorId }),
					inArray(lancamentos.period, [period, previousPeriod]),
					eq(lancamentos.transactionType, "Despesa"),
					eq(categorias.type, "despesa"),
					excludeAutoInvoiceEntries(),
				),
			)
			.groupBy(
				categorias.id,
				categorias.name,
				categorias.icon,
				lancamentos.period,
			),
		db
			.select({
				categoriaId: orcamentos.categoriaId,
				amount: orcamentos.amount,
			})
			.from(orcamentos)
			.where(and(eq(orcamentos.userId, userId), eq(orcamentos.period, period))),
	]);

	return buildCategoryBreakdownData({
		rows,
		budgetRows,
		period,
	});
}
