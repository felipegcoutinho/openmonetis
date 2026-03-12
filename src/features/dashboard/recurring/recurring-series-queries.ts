import { and, eq, inArray } from "drizzle-orm";
import type { RecurringSeriesTemplate } from "@/db/schema";
import { categorias, recurringSeries } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPagadorId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { addMonthsToPeriod } from "@/shared/utils/period";

export type RecurringSeriesItem = {
	id: string;
	name: string;
	amount: number;
	categoryName: string | null;
	categoryIcon: string | null;
	paymentMethod: string;
	dayOfMonth: number;
	status: "active" | "paused" | "cancelled";
	nextPeriod: string;
	lastGeneratedPeriod: string;
};

export type RecurringSeriesData = {
	series: RecurringSeriesItem[];
};

export async function fetchRecurringSeries(
	userId: string,
): Promise<RecurringSeriesData> {
	const adminPagadorId = await getAdminPagadorId(userId);

	const rows = await db
		.select({
			id: recurringSeries.id,
			status: recurringSeries.status,
			dayOfMonth: recurringSeries.dayOfMonth,
			lastGeneratedPeriod: recurringSeries.lastGeneratedPeriod,
			templateData: recurringSeries.templateData,
		})
		.from(recurringSeries)
		.where(
			and(
				eq(recurringSeries.userId, userId),
				inArray(recurringSeries.status, ["active", "paused"]),
			),
		);

	if (rows.length === 0) {
		return { series: [] };
	}

	// Fetch category names for all series in one query
	const categoryIds = rows
		.map((r) => (r.templateData as RecurringSeriesTemplate).categoriaId)
		.filter((id): id is string => id !== null);

	const categoryMap = new Map<string, { name: string; icon: string | null }>();
	if (categoryIds.length > 0) {
		const cats = await db
			.select({
				id: categorias.id,
				name: categorias.name,
				icon: categorias.icon,
			})
			.from(categorias)
			.where(inArray(categorias.id, categoryIds));
		for (const cat of cats) {
			categoryMap.set(cat.id, { name: cat.name, icon: cat.icon });
		}
	}

	const series = rows
		.filter((row) => {
			// If admin pagador exists, only show series belonging to admin
			if (!adminPagadorId) return true;
			const template = row.templateData as RecurringSeriesTemplate;
			return (
				template.pagadorId === adminPagadorId || template.pagadorId === null
			);
		})
		.map((row): RecurringSeriesItem => {
			const template = row.templateData as RecurringSeriesTemplate;
			const category = template.categoriaId
				? categoryMap.get(template.categoriaId)
				: null;
			return {
				id: row.id,
				name: template.name,
				amount: Math.abs(toNumber(template.amount)),
				categoryName: category?.name ?? null,
				categoryIcon: category?.icon ?? null,
				paymentMethod: template.paymentMethod,
				dayOfMonth: row.dayOfMonth,
				status: row.status as "active" | "paused",
				nextPeriod: addMonthsToPeriod(row.lastGeneratedPeriod, 1),
				lastGeneratedPeriod: row.lastGeneratedPeriod,
			};
		});

	return { series };
}
