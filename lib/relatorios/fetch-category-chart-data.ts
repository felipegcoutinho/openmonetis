import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { categorias, lancamentos } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
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

	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { months: [], categories: [], chartData: [], allCategories: [] };
	}

	const whereConditions = [
		eq(lancamentos.userId, userId),
		eq(lancamentos.pagadorId, adminPagadorId),
		inArray(lancamentos.period, periods),
		or(eq(categorias.type, "despesa"), eq(categorias.type, "receita")),
		or(
			isNull(lancamentos.note),
			sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
		),
	];

	if (categoryIds && categoryIds.length > 0) {
		whereConditions.push(inArray(categorias.id, categoryIds));
	}

	const [rows, allCategoriesRows] = await Promise.all([
		db
			.select({
				categoryId: categorias.id,
				categoryName: categorias.name,
				categoryIcon: categorias.icon,
				categoryType: categorias.type,
				period: lancamentos.period,
				total: sql<number>`coalesce(sum(abs(${lancamentos.amount})), 0)`,
			})
			.from(lancamentos)
			.innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
			.where(and(...whereConditions))
			.groupBy(
				categorias.id,
				categorias.name,
				categorias.icon,
				categorias.type,
				lancamentos.period,
			),
		db
			.select({
				id: categorias.id,
				name: categorias.name,
				icon: categorias.icon,
				type: categorias.type,
			})
			.from(categorias)
			.where(eq(categorias.userId, userId))
			.orderBy(categorias.type, categorias.name),
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
		const [year, month] = period.split("-");
		const date = new Date(
			Number.parseInt(year, 10),
			Number.parseInt(month, 10) - 1,
			1,
		);
		const monthLabel = format(date, "MMM", { locale: ptBR }).toUpperCase();

		const dataPoint: { month: string; [key: string]: number | string } = {
			month: monthLabel,
		};

		for (const category of categoryMap.values()) {
			dataPoint[category.name] = category.dataByPeriod.get(period) ?? 0;
		}

		return dataPoint;
	});

	const months = periods.map((period) => {
		const [year, month] = period.split("-");
		const date = new Date(
			Number.parseInt(year, 10),
			Number.parseInt(month, 10) - 1,
			1,
		);
		return format(date, "MMM", { locale: ptBR }).toUpperCase();
	});

	const categories = Array.from(categoryMap.values()).map((cat) => ({
		id: cat.id,
		name: cat.name,
		icon: cat.icon,
		type: cat.type,
	}));

	return { months, categories, chartData, allCategories };
}
