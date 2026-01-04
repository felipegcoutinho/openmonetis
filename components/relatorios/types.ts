/**
 * UI types for Category Report components
 */

/**
 * Category option for report filters
 * Includes type field for filtering despesas/receitas
 */
export interface CategoryOption {
    id: string;
    name: string;
    icon: string | null;
    type: "despesa" | "receita";
}

/**
 * Filter state for category report
 * Manages selected categories and date range
 */
export interface FilterState {
    selectedCategories: string[]; // Array of category IDs
    startPeriod: string; // Format: "YYYY-MM"
    endPeriod: string; // Format: "YYYY-MM"
}

/**
 * Props for CategoryReportFilters component
 */
export interface CategoryReportFiltersProps {
    categories: CategoryOption[];
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    isLoading?: boolean;
}
