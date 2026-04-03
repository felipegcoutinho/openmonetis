import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { categories, financialAccounts, transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { formatPeriodMonthShort } from "@/shared/utils/period";
import { generatePeriodRange } from "./utils";

export type CategoryChartData = {
	months: string[]; // Short month labels (e.g., "JAN", "FEV")
	categories: Array<{
		id: string;
		name: string;
		icon: string | null;
		type: "despesa" | "receita";
	}>;
	chartData: Array<{
		month: string;
		[categoryName: string]: number | string;
	}>;
	allCategories: Array<{
		id: string;
		name: string;
		icon: string | null;
		type: "despesa" | "receita";
	}>;
};

export async function fetchCategoryChartData(
	userId: string,
	startPeriod: string,
	endPeriod: string,
	categoryIds?: string[],
): Promise<CategoryChartData> {
	const periods = generatePeriodRange(startPeriod, endPeriod);

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { months: [], categories: [], chartData: [], allCategories: [] };
	}

	const whereConditions = [
		eq(transactions.userId, userId),
		eq(transactions.payerId, adminPayerId),
		inArray(transactions.period, periods),
		or(eq(categories.type, "despesa"), eq(categories.type, "receita")),
		or(
			isNull(transactions.note),
			sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
		),
		excludeTransactionsFromExcludedAccounts(),
	];

	if (categoryIds && categoryIds.length > 0) {
		whereConditions.push(inArray(categories.id, categoryIds));
	}

	const [rows, allCategoriesRows] = await Promise.all([
		db
			.select({
				categoryId: categories.id,
				categoryName: categories.name,
				categoryIcon: categories.icon,
				categoryType: categories.type,
				period: transactions.period,
				total: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
			})
			.from(transactions)
			.innerJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(and(...whereConditions))
			.groupBy(
				categories.id,
				categories.name,
				categories.icon,
				categories.type,
				transactions.period,
			),
		db
			.select({
				id: categories.id,
				name: categories.name,
				icon: categories.icon,
				type: categories.type,
			})
			.from(categories)
			.where(eq(categories.userId, userId))
			.orderBy(categories.type, categories.name),
	]);

	const allCategories = allCategoriesRows.map(
		(cat: { id: string; name: string; icon: string | null; type: string }) => ({
			id: cat.id,
			name: cat.name,
			icon: cat.icon,
			type: cat.type as "despesa" | "receita",
		}),
	);

	const categoryMap = new Map<
		string,
		{
			id: string;
			name: string;
			icon: string | null;
			type: "despesa" | "receita";
			dataByPeriod: Map<string, number>;
		}
	>();

	for (const row of rows) {
		const amount = Math.abs(toNumber(row.total));
		const { categoryId, categoryName, categoryIcon, categoryType, period } =
			row;

		if (!categoryMap.has(categoryId)) {
			categoryMap.set(categoryId, {
				id: categoryId,
				name: categoryName,
				icon: categoryIcon,
				type: categoryType as "despesa" | "receita",
				dataByPeriod: new Map(),
			});
		}

		categoryMap.get(categoryId)?.dataByPeriod.set(period, amount);
	}

	const chartData = periods.map((period) => {
		const monthLabel = formatPeriodMonthShort(period).toUpperCase();

		const dataPoint: { month: string; [key: string]: number | string } = {
			month: monthLabel,
		};

		for (const category of categoryMap.values()) {
			dataPoint[category.name] = category.dataByPeriod.get(period) ?? 0;
		}

		return dataPoint;
	});

	const months = periods.map((period) =>
		formatPeriodMonthShort(period).toUpperCase(),
	);

	const categoryList = Array.from(categoryMap.values()).map((cat) => ({
		id: cat.id,
		name: cat.name,
		icon: cat.icon,
		type: cat.type,
	}));

	return { months, categories: categoryList, chartData, allCategories };
}
