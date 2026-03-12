import { and, eq, inArray, sql } from "drizzle-orm";
import { categorias, contas, lancamentos, orcamentos } from "@/db/schema";
import {
	buildCategoryBreakdownData,
	type DashboardCategoryBreakdownData,
	type DashboardCategoryBreakdownItem,
} from "@/features/dashboard/categories/category-breakdown";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
} from "@/features/dashboard/lancamento-filters";
import { db } from "@/shared/lib/db";
import { getAdminPagadorId } from "@/shared/lib/payers/get-admin-id";
import { getPreviousPeriod } from "@/shared/utils/period";

export type CategoryIncomeItem = DashboardCategoryBreakdownItem;
export type IncomeByCategoryData = DashboardCategoryBreakdownData;

export async function fetchIncomeByCategory(
	userId: string,
	period: string,
): Promise<IncomeByCategoryData> {
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
			.leftJoin(contas, eq(lancamentos.contaId, contas.id))
			.where(
				and(
					...buildDashboardAdminFilters({ userId, adminPagadorId }),
					inArray(lancamentos.period, [period, previousPeriod]),
					eq(lancamentos.transactionType, "Receita"),
					eq(categorias.type, "receita"),
					excludeAutoInvoiceEntries(),
					excludeInitialBalanceWhenConfigured(),
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
