import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { categorias, lancamentos, orcamentos } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
import { calculatePercentageChange } from "@/lib/utils/math";
import { getPreviousPeriod } from "@/lib/utils/period";

export type CategoryExpenseItem = {
	categoryId: string;
	categoryName: string;
	categoryIcon: string | null;
	currentAmount: number;
	previousAmount: number;
	percentageChange: number | null;
	percentageOfTotal: number;
	budgetAmount: number | null;
	budgetUsedPercentage: number | null;
};

export type ExpensesByCategoryData = {
	categories: CategoryExpenseItem[];
	currentTotal: number;
	previousTotal: number;
};

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
					eq(lancamentos.userId, userId),
					eq(lancamentos.pagadorId, adminPagadorId),
					inArray(lancamentos.period, [period, previousPeriod]),
					eq(lancamentos.transactionType, "Despesa"),
					eq(categorias.type, "despesa"),
					or(
						isNull(lancamentos.note),
						sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
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

	// Build budget lookup
	const budgetMap = new Map<string, number>();
	for (const row of budgetRows) {
		if (row.categoriaId) {
			budgetMap.set(row.categoriaId, toNumber(row.amount));
		}
	}

	// Build category data from grouped results
	const categoryMap = new Map<
		string,
		{
			name: string;
			icon: string | null;
			current: number;
			previous: number;
		}
	>();

	for (const row of rows) {
		const entry = categoryMap.get(row.categoryId) ?? {
			name: row.categoryName,
			icon: row.categoryIcon,
			current: 0,
			previous: 0,
		};

		const amount = Math.abs(toNumber(row.total));
		if (row.period === period) {
			entry.current = amount;
		} else {
			entry.previous = amount;
		}
		categoryMap.set(row.categoryId, entry);
	}

	// Calculate totals
	let currentTotal = 0;
	let previousTotal = 0;
	for (const entry of categoryMap.values()) {
		currentTotal += entry.current;
		previousTotal += entry.previous;
	}

	// Build result
	const categories: CategoryExpenseItem[] = [];
	for (const [categoryId, entry] of categoryMap) {
		const percentageChange = calculatePercentageChange(
			entry.current,
			entry.previous,
		);
		const percentageOfTotal =
			currentTotal > 0 ? (entry.current / currentTotal) * 100 : 0;

		const budgetAmount = budgetMap.get(categoryId) ?? null;
		const budgetUsedPercentage =
			budgetAmount && budgetAmount > 0
				? (entry.current / budgetAmount) * 100
				: null;

		categories.push({
			categoryId,
			categoryName: entry.name,
			categoryIcon: entry.icon,
			currentAmount: entry.current,
			previousAmount: entry.previous,
			percentageChange,
			percentageOfTotal,
			budgetAmount,
			budgetUsedPercentage,
		});
	}

	// Ordena por valor atual (maior para menor)
	categories.sort((a, b) => b.currentAmount - a.currentAmount);

	return {
		categories,
		currentTotal,
		previousTotal,
	};
}
