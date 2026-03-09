import { and, eq, ne, sql } from "drizzle-orm";
import { categorias, lancamentos, orcamentos } from "@/db/schema";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
import { safeToNumber as toNumber } from "@/lib/utils/number";

const BUDGET_CRITICAL_THRESHOLD = 80;

export type GoalProgressStatus = "on-track" | "critical" | "exceeded";

export type GoalProgressItem = {
	id: string;
	categoryId: string | null;
	categoryName: string;
	categoryIcon: string | null;
	period: string;
	createdAt: string;
	budgetAmount: number;
	spentAmount: number;
	usedPercentage: number;
	status: GoalProgressStatus;
};

export type GoalProgressCategory = {
	id: string;
	name: string;
	icon: string | null;
};

export type GoalsProgressData = {
	items: GoalProgressItem[];
	categories: GoalProgressCategory[];
	totalBudgets: number;
	exceededCount: number;
	criticalCount: number;
};

const resolveStatus = (usedPercentage: number): GoalProgressStatus => {
	if (usedPercentage >= 100) {
		return "exceeded";
	}
	if (usedPercentage >= BUDGET_CRITICAL_THRESHOLD) {
		return "critical";
	}
	return "on-track";
};

export async function fetchGoalsProgressData(
	userId: string,
	period: string,
): Promise<GoalsProgressData> {
	const adminPagadorId = await getAdminPagadorId(userId);

	if (!adminPagadorId) {
		return {
			items: [],
			categories: [],
			totalBudgets: 0,
			exceededCount: 0,
			criticalCount: 0,
		};
	}

	const [rows, categoryRows] = await Promise.all([
		db
			.select({
				orcamentoId: orcamentos.id,
				categoryId: categorias.id,
				categoryName: categorias.name,
				categoryIcon: categorias.icon,
				period: orcamentos.period,
				createdAt: orcamentos.createdAt,
				budgetAmount: orcamentos.amount,
				spentAmount: sql<number>`COALESCE(SUM(ABS(${lancamentos.amount})), 0)`,
			})
			.from(orcamentos)
			.innerJoin(categorias, eq(orcamentos.categoriaId, categorias.id))
			.leftJoin(
				lancamentos,
				and(
					eq(lancamentos.categoriaId, orcamentos.categoriaId),
					eq(lancamentos.userId, orcamentos.userId),
					eq(lancamentos.period, orcamentos.period),
					eq(lancamentos.pagadorId, adminPagadorId),
					eq(lancamentos.transactionType, "Despesa"),
					ne(lancamentos.condition, "cancelado"),
				),
			)
			.where(and(eq(orcamentos.userId, userId), eq(orcamentos.period, period)))
			.groupBy(
				orcamentos.id,
				categorias.id,
				categorias.name,
				categorias.icon,
				orcamentos.period,
				orcamentos.createdAt,
				orcamentos.amount,
			),
		db.query.categorias.findMany({
			where: and(eq(categorias.userId, userId), eq(categorias.type, "despesa")),
			orderBy: (category, { asc }) => [asc(category.name)],
		}),
	]);

	const categories: GoalProgressCategory[] = categoryRows.map((category) => ({
		id: category.id,
		name: category.name,
		icon: category.icon,
	}));

	const items: GoalProgressItem[] = rows
		.map((row) => {
			const budgetAmount = toNumber(row.budgetAmount);
			const spentAmount = toNumber(row.spentAmount);
			const usedPercentage =
				budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

			return {
				id: row.orcamentoId,
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

	const exceededCount = items.filter(
		(item) => item.status === "exceeded",
	).length;
	const criticalCount = items.filter(
		(item) => item.status === "critical",
	).length;

	return {
		items,
		categories,
		totalBudgets: items.length,
		exceededCount,
		criticalCount,
	};
}
