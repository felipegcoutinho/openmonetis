import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	ne,
	not,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { categories, financialAccounts, transactions } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

const DESPESA = "Despesa";

export type EstablishmentData = {
	name: string;
	count: number;
	totalAmount: number;
	avgAmount: number;
	categories: { name: string; count: number }[];
};

export type TopCategoryData = {
	id: string;
	name: string;
	icon: string | null;
	totalAmount: number;
	transactionCount: number;
};

export type TopEstabelecimentosData = {
	establishments: EstablishmentData[];
	topCategories: TopCategoryData[];
	summary: {
		totalEstablishments: number;
		totalTransactions: number;
		totalSpent: number;
		avgPerTransaction: number;
		mostFrequent: string | null;
		highestSpending: string | null;
	};
	periodLabel: string;
};

export type PeriodFilter = "3" | "6" | "12";

function buildPeriodRange(currentPeriod: string, months: number): string[] {
	const periods: string[] = [];
	let p = currentPeriod;
	for (let i = 0; i < months; i++) {
		periods.unshift(p);
		p = getPreviousPeriod(p);
	}
	return periods;
}

export async function fetchTopEstablishmentsData(
	userId: string,
	currentPeriod: string,
	periodFilter: PeriodFilter = "6",
): Promise<TopEstabelecimentosData> {
	const months = parseInt(periodFilter, 10);
	const periods = buildPeriodRange(currentPeriod, months);
	const startPeriod = periods[0];
	const adminPayerId = await getAdminPayerId(userId);
	const periodLabel =
		months === 3
			? "Últimos 3 meses"
			: months === 6
				? "Últimos 6 meses"
				: "Últimos 12 meses";

	if (!adminPayerId) {
		return {
			establishments: [],
			topCategories: [],
			summary: {
				totalEstablishments: 0,
				totalTransactions: 0,
				totalSpent: 0,
				avgPerTransaction: 0,
				mostFrequent: null,
				highestSpending: null,
			},
			periodLabel,
		};
	}

	const baseExpenseConditions = [
		eq(transactions.userId, userId),
		gte(transactions.period, startPeriod),
		lte(transactions.period, currentPeriod),
		eq(transactions.payerId, adminPayerId),
		eq(transactions.transactionType, DESPESA),
	] as const;
	const exclusionConditions = [
		or(
			isNull(transactions.note),
			not(ilike(transactions.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
		),
		or(
			ne(transactions.note, INITIAL_BALANCE_NOTE),
			isNull(financialAccounts.excludeInitialBalanceFromIncome),
			eq(financialAccounts.excludeInitialBalanceFromIncome, false),
		),
	] as const;

	// Fetch establishments with transaction count and total amount
	const establishmentsData = await db
		.select({
			name: transactions.name,
			count: count().as("count"),
			totalAmount: sum(transactions.amount).as("total"),
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(and(...baseExpenseConditions, ...exclusionConditions))
		.groupBy(transactions.name)
		.orderBy(desc(sql`count`))
		.limit(50);

	const establishmentNames = establishmentsData
		.map((est) => est.name)
		.filter((name): name is string => !!name);

	const categoriesByEstablishment =
		establishmentNames.length > 0
			? await db
					.select({
						establishmentName: transactions.name,
						categoryId: transactions.categoryId,
						count: count().as("count"),
					})
					.from(transactions)
					.leftJoin(
						financialAccounts,
						eq(transactions.accountId, financialAccounts.id),
					)
					.where(
						and(
							...baseExpenseConditions,
							...exclusionConditions,
							inArray(transactions.name, establishmentNames),
						),
					)
					.groupBy(transactions.name, transactions.categoryId)
			: [];

	// Fetch all category names
	const allCategories = await db
		.select({
			id: categories.id,
			name: categories.name,
			icon: categories.icon,
		})
		.from(categories)
		.where(eq(categories.userId, userId));

	type CategoryInfo = { id: string; name: string; icon: string | null };
	const categoryMap = new Map<string, CategoryInfo>(
		allCategories.map((c): [string, CategoryInfo] => [c.id, c as CategoryInfo]),
	);

	// Build establishment data with categories
	type EstablishmentRow = (typeof establishmentsData)[0];
	const categoriesByEstablishmentMap = new Map<
		string,
		Array<{ name: string; count: number }>
	>();

	for (const categoryRow of categoriesByEstablishment) {
		if (!categoryRow.establishmentName || !categoryRow.categoryId) {
			continue;
		}

		const current =
			categoriesByEstablishmentMap.get(categoryRow.establishmentName) ?? [];
		current.push({
			name:
				categoryMap.get(categoryRow.categoryId as string)?.name ||
				"Sem categoria",
			count: Number(categoryRow.count) || 0,
		});
		categoriesByEstablishmentMap.set(categoryRow.establishmentName, current);
	}

	const establishments: EstablishmentData[] = establishmentsData.map(
		(est: EstablishmentRow) => {
			const cnt = Number(est.count) || 0;
			const total = Math.abs(safeToNumber(est.totalAmount));

			const estCategories = (categoriesByEstablishmentMap.get(est.name) ?? [])
				.sort(
					(
						a: { name: string; count: number },
						b: { name: string; count: number },
					) => b.count - a.count,
				)
				.slice(0, 3);

			return {
				name: est.name,
				count: cnt,
				totalAmount: total,
				avgAmount: cnt > 0 ? total / cnt : 0,
				categories: estCategories,
			};
		},
	);

	// Fetch top categories by spending
	const topCategoriesData = await db
		.select({
			categoryId: transactions.categoryId,
			totalAmount: sum(transactions.amount).as("total"),
			count: count().as("count"),
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(and(...baseExpenseConditions, ...exclusionConditions))
		.groupBy(transactions.categoryId)
		.orderBy(sql`total ASC`)
		.limit(10);

	type TopCategoryRow = (typeof topCategoriesData)[0];

	const topCategories: TopCategoryData[] = topCategoriesData
		.filter((c: TopCategoryRow) => c.categoryId)
		.map((cat: TopCategoryRow) => {
			const catInfo = categoryMap.get(cat.categoryId as string);
			return {
				id: cat.categoryId as string,
				name: catInfo?.name || "Sem categoria",
				icon: catInfo?.icon || null,
				totalAmount: Math.abs(safeToNumber(cat.totalAmount)),
				transactionCount: Number(cat.count) || 0,
			};
		});

	// Calculate summary
	const totalTransactions = establishments.reduce((acc, e) => acc + e.count, 0);
	const totalSpent = establishments.reduce((acc, e) => acc + e.totalAmount, 0);

	const mostFrequent =
		establishments.length > 0 ? establishments[0].name : null;

	const sortedBySpending = [...establishments].sort(
		(a, b) => b.totalAmount - a.totalAmount,
	);
	const highestSpending =
		sortedBySpending.length > 0 ? sortedBySpending[0].name : null;

	return {
		establishments,
		topCategories,
		summary: {
			totalEstablishments: establishments.length,
			totalTransactions,
			totalSpent,
			avgPerTransaction:
				totalTransactions > 0 ? totalSpent / totalTransactions : 0,
			mostFrequent,
			highestSpending,
		},
		periodLabel,
	};
}
