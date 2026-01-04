/**
 * Data fetching function for Category Report
 */

import { categorias, lancamentos, pagadores } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { toNumber } from "@/lib/dashboard/common";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type {
    CategoryReportData,
    CategoryReportFilters,
    CategoryReportItem,
    MonthlyData,
} from "./types";
import { calculatePercentageChange, generatePeriodRange } from "./utils";

/**
 * Fetches category report data for multiple periods
 *
 * @param userId - User ID to filter data
 * @param filters - Report filters (startPeriod, endPeriod, categoryIds)
 * @returns Complete category report data
 */
export async function fetchCategoryReport(
    userId: string,
    filters: CategoryReportFilters
): Promise<CategoryReportData> {
    const { startPeriod, endPeriod, categoryIds } = filters;

    // Generate all periods in the range
    const periods = generatePeriodRange(startPeriod, endPeriod);

    // Build WHERE conditions
    const whereConditions = [
        eq(lancamentos.userId, userId),
        inArray(lancamentos.period, periods),
        eq(pagadores.role, PAGADOR_ROLE_ADMIN),
        or(
            eq(categorias.type, "despesa"),
            eq(categorias.type, "receita")
        ),
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
            total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
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

    // Process results into CategoryReportData structure
    const categoryMap = new Map<string, CategoryReportItem>();
    const periodTotalsMap = new Map<string, number>();

    // Initialize period totals
    for (const period of periods) {
        periodTotalsMap.set(period, 0);
    }

    // Process each row
    for (const row of rows) {
        const amount = Math.abs(toNumber(row.total));
        const { categoryId, categoryName, categoryIcon, categoryType, period } = row;

        // Get or create category item
        if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
                categoryId,
                name: categoryName,
                icon: categoryIcon,
                type: categoryType as "despesa" | "receita",
                monthlyData: new Map<string, MonthlyData>(),
                total: 0,
            });
        }

        const categoryItem = categoryMap.get(categoryId)!;

        // Add monthly data (will calculate percentage later)
        categoryItem.monthlyData.set(period, {
            period,
            amount,
            previousAmount: 0, // Will be filled in next step
            percentageChange: null, // Will be calculated in next step
        });

        // Update category total
        categoryItem.total += amount;

        // Update period total
        const currentPeriodTotal = periodTotalsMap.get(period) ?? 0;
        periodTotalsMap.set(period, currentPeriodTotal + amount);
    }

    // Calculate percentage changes (compare with previous period)
    for (const categoryItem of categoryMap.values()) {
        const sortedPeriods = Array.from(categoryItem.monthlyData.keys()).sort();

        for (let i = 0; i < sortedPeriods.length; i++) {
            const period = sortedPeriods[i];
            const monthlyData = categoryItem.monthlyData.get(period)!;

            if (i > 0) {
                // Get previous period data
                const prevPeriod = sortedPeriods[i - 1];
                const prevMonthlyData = categoryItem.monthlyData.get(prevPeriod);
                const previousAmount = prevMonthlyData?.amount ?? 0;

                // Update with previous amount and calculate percentage
                monthlyData.previousAmount = previousAmount;
                monthlyData.percentageChange = calculatePercentageChange(
                    monthlyData.amount,
                    previousAmount
                );
            } else {
                // First period - no comparison
                monthlyData.previousAmount = 0;
                monthlyData.percentageChange = null;
            }
        }
    }

    // Fill in missing periods with zero values
    for (const categoryItem of categoryMap.values()) {
        for (const period of periods) {
            if (!categoryItem.monthlyData.has(period)) {
                // Find previous period data for percentage calculation
                const periodIndex = periods.indexOf(period);
                let previousAmount = 0;

                if (periodIndex > 0) {
                    const prevPeriod = periods[periodIndex - 1];
                    const prevData = categoryItem.monthlyData.get(prevPeriod);
                    previousAmount = prevData?.amount ?? 0;
                }

                categoryItem.monthlyData.set(period, {
                    period,
                    amount: 0,
                    previousAmount,
                    percentageChange: calculatePercentageChange(0, previousAmount),
                });
            }
        }
    }

    // Convert to array and sort
    const categories = Array.from(categoryMap.values());

    // Sort: despesas first (by total desc), then receitas (by total desc)
    categories.sort((a, b) => {
        // First by type: despesa comes before receita
        if (a.type !== b.type) {
            return a.type === "despesa" ? -1 : 1;
        }
        // Then by total (descending)
        return b.total - a.total;
    });

    // Calculate grand total
    let grandTotal = 0;
    for (const categoryItem of categories) {
        grandTotal += categoryItem.total;
    }

    return {
        categories,
        periods,
        totals: periodTotalsMap,
        grandTotal,
    };
}
