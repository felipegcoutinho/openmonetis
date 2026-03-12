import { and, asc, eq, inArray, isNull, or, sql, sum } from "drizzle-orm";
import {
	categorias,
	lancamentos,
	type Orcamento,
	orcamentos,
	pagadores,
} from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";

const toNumber = (value: string | number | null | undefined) => {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
};

export type BudgetData = {
	id: string;
	amount: number;
	spent: number;
	period: string;
	createdAt: string;
	category: {
		id: string;
		name: string;
		icon: string | null;
	} | null;
};

export type CategoryOption = {
	id: string;
	name: string;
	icon: string | null;
};

export async function fetchBudgetsForUser(
	userId: string,
	selectedPeriod: string,
): Promise<{
	budgets: BudgetData[];
	categoriesOptions: CategoryOption[];
}> {
	const [budgetRows, categoryRows] = await Promise.all([
		db.query.orcamentos.findMany({
			where: and(
				eq(orcamentos.userId, userId),
				eq(orcamentos.period, selectedPeriod),
			),
			with: {
				categoria: true,
			},
		}),
		db.query.categorias.findMany({
			columns: {
				id: true,
				name: true,
				icon: true,
			},
			where: and(eq(categorias.userId, userId), eq(categorias.type, "despesa")),
			orderBy: asc(categorias.name),
		}),
	]);

	const categoryIds = budgetRows
		.map((budget: Orcamento) => budget.categoriaId)
		.filter((id: string | null): id is string => Boolean(id));

	let totalsByCategory = new Map<string, number>();

	if (categoryIds.length > 0) {
		const totals = await db
			.select({
				categoriaId: lancamentos.categoriaId,
				totalAmount: sum(lancamentos.amount).as("totalAmount"),
			})
			.from(lancamentos)
			.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.period, selectedPeriod),
					eq(lancamentos.transactionType, "Despesa"),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					inArray(lancamentos.categoriaId, categoryIds),
					or(
						isNull(lancamentos.note),
						sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(lancamentos.categoriaId);

		totalsByCategory = new Map(
			totals.map(
				(row: { categoriaId: string | null; totalAmount: string | null }) => [
					row.categoriaId ?? "",
					Math.abs(toNumber(row.totalAmount)),
				],
			),
		);
	}

	const budgets = budgetRows
		.map((budget: Orcamento) => ({
			id: budget.id,
			amount: toNumber(budget.amount),
			spent: totalsByCategory.get(budget.categoriaId ?? "") ?? 0,
			period: budget.period,
			createdAt: budget.createdAt.toISOString(),
			category: budget.categoria
				? {
						id: budget.categoria.id,
						name: budget.categoria.name,
						icon: budget.categoria.icon,
					}
				: null,
		}))
		.sort((a, b) =>
			(a.category?.name ?? "").localeCompare(b.category?.name ?? "", "pt-BR", {
				sensitivity: "base",
			}),
		);

	const categoriesOptions = categoryRows.map((category) => ({
		id: category.id,
		name: category.name,
		icon: category.icon,
	}));

	return { budgets, categoriesOptions };
}
