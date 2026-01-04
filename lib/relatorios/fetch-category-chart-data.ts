/**
 * Data fetching function for Category Chart (based on selected filters)
 */

import { categorias, lancamentos, pagadores } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { toNumber } from "@/lib/dashboard/common";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { generatePeriodRange } from "./utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  categoryIds?: string[]
): Promise<CategoryChartData> {
  // Generate all periods in the range
  const periods = generatePeriodRange(startPeriod, endPeriod);

  // Build WHERE conditions
  const whereConditions = [
    eq(lancamentos.userId, userId),
    inArray(lancamentos.period, periods),
    eq(pagadores.role, PAGADOR_ROLE_ADMIN),
    or(eq(categorias.type, "despesa"), eq(categorias.type, "receita")),
    or(
      isNull(lancamentos.note),
      sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`
    ),
  ];

  // Add optional category filter
  if (categoryIds && categoryIds.length > 0) {
    whereConditions.push(inArray(categorias.id, categoryIds));
  }

  // Query to get aggregated data by category and period
  const rows = await db
    .select({
      categoryId: categorias.id,
      categoryName: categorias.name,
      categoryIcon: categorias.icon,
      categoryType: categorias.type,
      period: lancamentos.period,
      total: sql<number>`coalesce(sum(abs(${lancamentos.amount})), 0)`,
    })
    .from(lancamentos)
    .innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
    .innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
    .where(and(...whereConditions))
    .groupBy(
      categorias.id,
      categorias.name,
      categorias.icon,
      categorias.type,
      lancamentos.period
    );

  // Fetch all categories for the user (for category selection)
  const allCategoriesRows = await db
    .select({
      id: categorias.id,
      name: categorias.name,
      icon: categorias.icon,
      type: categorias.type,
    })
    .from(categorias)
    .where(eq(categorias.userId, userId))
    .orderBy(categorias.type, categorias.name);

  // Map all categories
  const allCategories = allCategoriesRows.map((cat: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  }) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    type: cat.type as "despesa" | "receita",
  }));

  // Process results into chart format
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

  // Process each row
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

    const categoryItem = categoryMap.get(categoryId)!;
    categoryItem.dataByPeriod.set(period, amount);
  }

  // Build chart data
  const chartData = periods.map((period) => {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthLabel = format(date, "MMM", { locale: ptBR }).toUpperCase();

    const dataPoint: { month: string; [key: string]: number | string } = {
      month: monthLabel,
    };

    // Add data for each category
    for (const category of categoryMap.values()) {
      const value = category.dataByPeriod.get(period) ?? 0;
      dataPoint[category.name] = value;
    }

    return dataPoint;
  });

  // Generate month labels
  const months = periods.map((period) => {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMM", { locale: ptBR }).toUpperCase();
  });

  // Build categories array
  const categories = Array.from(categoryMap.values()).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    type: cat.type,
  }));

  return {
    months,
    categories,
    chartData,
    allCategories,
  };
}
