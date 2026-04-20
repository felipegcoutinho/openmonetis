import { and, asc, eq, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { budgets, categories, transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

const toNumber = (value: string | number | null | undefined) => {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
};

type BudgetData = {
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
	const adminPayerId = await getAdminPayerId(userId);

	const [budgetRows, categoryRows] = await Promise.all([
		db.query.budgets.findMany({
			where: and(
				eq(budgets.userId, userId),
				eq(budgets.period, selectedPeriod),
			),
			with: {
				category: true,
			},
		}),
		db.query.categories.findMany({
			columns: {
				id: true,
				name: true,
				icon: true,
			},
			where: and(eq(categories.userId, userId), eq(categories.type, "despesa")),
			orderBy: asc(categories.name),
		}),
	]);

	const categoryIds = budgetRows
		.map((budget) => budget.categoryId)
		.filter((id: string | null): id is string => Boolean(id));

	let totalsByCategory = new Map<string, number>();

	if (categoryIds.length > 0 && adminPayerId) {
		const totals = await db
			.select({
				categoryId: transactions.categoryId,
				totalAmount: sum(transactions.amount).as("totalAmount"),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.period, selectedPeriod),
					eq(transactions.transactionType, "Despesa"),
					eq(transactions.payerId, adminPayerId),
					inArray(transactions.categoryId, categoryIds),
					or(
						isNull(transactions.note),
						sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(transactions.categoryId);

		totalsByCategory = new Map(
			totals.map(
				(row: { categoryId: string | null; totalAmount: string | null }) => [
					row.categoryId ?? "",
					Math.abs(toNumber(row.totalAmount)),
				],
			),
		);
	}

	const budgetList = budgetRows
		.map((budget) => ({
			id: budget.id,
			amount: toNumber(budget.amount),
			spent: totalsByCategory.get(budget.categoryId ?? "") ?? 0,
			period: budget.period,
			createdAt: budget.createdAt.toISOString(),
			category: (() => {
				type Cat = { id: string; name: string; icon: string | null };
				const cat = budget.category as Cat | null | undefined;
				return cat ? { id: cat.id, name: cat.name, icon: cat.icon } : null;
			})(),
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

	return { budgets: budgetList, categoriesOptions };
}
