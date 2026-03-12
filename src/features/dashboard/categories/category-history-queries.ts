import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { categorias, lancamentos, pagadores } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { CATEGORY_COLORS } from "@/shared/utils/category-colors";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import {
	addMonthsToPeriod,
	buildPeriodWindow,
	formatPeriodMonthShort,
} from "@/shared/utils/period";

export type CategoryOption = {
	id: string;
	name: string;
	icon: string | null;
	type: "receita" | "despesa";
};

export type CategoryHistoryItem = {
	id: string;
	name: string;
	icon: string | null;
	color: string;
	data: Record<string, number>;
};

export type CategoryHistoryData = {
	months: string[]; // ["NOV", "DEZ", "JAN", ...]
	categories: CategoryHistoryItem[];
	chartData: Array<{
		month: string;
		[categoryName: string]: number | string;
	}>;
	allCategories: CategoryOption[];
};

const CHART_COLORS = CATEGORY_COLORS;
type MonthlyCategoryRow = {
	categoryId: string;
	categoryName: string;
	categoryIcon: string | null;
	period: string;
	totalAmount: unknown;
};

type UniqueCategory = {
	id: string;
	name: string;
	icon: string | null;
};

export async function fetchAllCategories(
	userId: string,
): Promise<CategoryOption[]> {
	const result = await db
		.select({
			id: categorias.id,
			name: categorias.name,
			icon: categorias.icon,
			type: categorias.type,
		})
		.from(categorias)
		.where(eq(categorias.userId, userId))
		.orderBy(categorias.type, categorias.name);

	return result as CategoryOption[];
}

/**
 * Fetches category expense/income history for all categories with transactions
 * Widget will allow user to select up to 5 to display
 */
export async function fetchCategoryHistory(
	userId: string,
	currentPeriod: string,
): Promise<CategoryHistoryData> {
	// Generate last 8 months, current month, and next month (10 total)
	const periods = buildPeriodWindow(addMonthsToPeriod(currentPeriod, 1), 10);
	const monthLabels = periods.map((period) =>
		formatPeriodMonthShort(period).toUpperCase(),
	);

	// Fetch all categories for the selector
	const allCategories = await fetchAllCategories(userId);

	// Fetch monthly data for ALL categories with transactions
	const monthlyDataQuery = (await db
		.select({
			categoryId: categorias.id,
			categoryName: categorias.name,
			categoryIcon: categorias.icon,
			period: lancamentos.period,
			totalAmount: sql<string>`SUM(ABS(${lancamentos.amount}))`.as(
				"total_amount",
			),
		})
		.from(lancamentos)
		.innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(categorias.userId, userId),
				inArray(lancamentos.period, periods),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				or(
					isNull(lancamentos.note),
					sql`${
						lancamentos.note
					} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
			),
		)
		.groupBy(
			categorias.id,
			categorias.name,
			categorias.icon,
			lancamentos.period,
		)) as MonthlyCategoryRow[];

	if (monthlyDataQuery.length === 0) {
		return {
			months: monthLabels,
			categories: [],
			chartData: monthLabels.map((month) => ({ month })),
			allCategories,
		};
	}

	// Get unique categories from query results
	const uniqueCategories: UniqueCategory[] = Array.from(
		new Map<string, UniqueCategory>(
			monthlyDataQuery.map((row) => [
				row.categoryId,
				{
					id: row.categoryId,
					name: row.categoryName,
					icon: row.categoryIcon,
				},
			]),
		).values(),
	);

	// Transform data into chart-ready format
	const categoriesMap = new Map<
		string,
		{
			id: string;
			name: string;
			icon: string | null;
			color: string;
			data: Record<string, number>;
		}
	>();

	// Initialize ALL categories with transactions with all months set to 0
	uniqueCategories.forEach((cat, index) => {
		const monthData: Record<string, number> = {};
		periods.forEach((_period, periodIndex) => {
			monthData[monthLabels[periodIndex]] = 0;
		});

		categoriesMap.set(cat.id, {
			id: cat.id,
			name: cat.name,
			icon: cat.icon,
			color: CHART_COLORS[index % CHART_COLORS.length],
			data: monthData,
		});
	});

	// Fill in actual values from monthly data
	monthlyDataQuery.forEach((row) => {
		const category = categoriesMap.get(row.categoryId);
		if (category) {
			const periodIndex = periods.indexOf(row.period);
			if (periodIndex !== -1) {
				const monthLabel = monthLabels[periodIndex];
				category.data[monthLabel] = toNumber(row.totalAmount);
			}
		}
	});

	// Convert to chart data format
	const chartData: CategoryHistoryData["chartData"] = monthLabels.map(
		(month) => {
			const dataPoint: {
				month: string;
				[categoryName: string]: number | string;
			} = { month };

			categoriesMap.forEach((category) => {
				dataPoint[category.name] = category.data[month];
			});

			return dataPoint;
		},
	);

	return {
		months: monthLabels,
		categories: Array.from(categoriesMap.values()),
		chartData,
		allCategories,
	};
}
