/**
 * Types for Category Report feature
 */

/**
 * Monthly data for a specific category in a specific period
 */
export type MonthlyData = {
    period: string; // Format: "YYYY-MM"
    amount: number; // Total amount for this category in this period
    previousAmount: number; // Amount from previous period (for comparison)
    percentageChange: number | null; // Percentage change from previous period
};

/**
 * Single category item in the report
 */
export type CategoryReportItem = {
    categoryId: string;
    name: string;
    icon: string | null;
    type: "despesa" | "receita";
    monthlyData: Map<string, MonthlyData>; // Key: period (YYYY-MM)
    total: number; // Total across all periods
};

/**
 * Complete category report data structure
 */
export type CategoryReportData = {
    categories: CategoryReportItem[]; // All categories with their data
    periods: string[]; // All periods in the report (sorted chronologically)
    totals: Map<string, number>; // Total per period across all categories
    grandTotal: number; // Total of all categories and all periods
};

/**
 * Filters for category report query
 */
export type CategoryReportFilters = {
    startPeriod: string; // Format: "YYYY-MM"
    endPeriod: string; // Format: "YYYY-MM"
    categoryIds?: string[]; // Optional: filter by specific categories
};

/**
 * Validation result for date range
 */
export type DateRangeValidation = {
    isValid: boolean;
    error?: string;
};
