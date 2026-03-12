import { redirect } from "next/navigation";
import type { Categoria } from "@/db/schema";
import { fetchCategoryChartData } from "@/features/reports/category-chart-queries";
import { fetchCategoryReport } from "@/features/reports/category-report-queries";
import { fetchUserCategories } from "@/features/reports/category-trends-queries";
import { CategoryReportPage } from "@/features/reports/components/category-report-page";
import type {
	CategoryOption,
	FilterState,
} from "@/features/reports/components/types";
import { validateDateRange } from "@/features/reports/utils";
import { getUserId } from "@/shared/lib/auth/server";
import type { CategoryReportFilters } from "@/shared/lib/types/reports";
import { addMonthsToPeriod, getCurrentPeriod } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

const getSingleParam = (
	params: Record<string, string | string[] | undefined> | undefined,
	key: string,
): string | null => {
	const value = params?.[key];
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function Page({ searchParams }: PageProps) {
	// Get authenticated user
	const userId = await getUserId();

	// Resolve search params
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	// Extract query params
	const inicioParam = getSingleParam(resolvedSearchParams, "inicio");
	const fimParam = getSingleParam(resolvedSearchParams, "fim");
	const categoriasParam = getSingleParam(resolvedSearchParams, "categorias");

	// Calculate default period (last 6 months)
	const currentPeriod = getCurrentPeriod();
	const defaultStartPeriod = addMonthsToPeriod(currentPeriod, -5); // 6 months including current

	// Use params or defaults
	const startPeriod = inicioParam ?? defaultStartPeriod;
	const endPeriod = fimParam ?? currentPeriod;

	// Parse selected categories
	const selectedCategoryIds = categoriasParam
		? categoriasParam.split(",").filter(Boolean)
		: [];

	// Validate date range
	const validation = validateDateRange(startPeriod, endPeriod);
	if (!validation.isValid) {
		// Redirect to default if validation fails
		redirect(
			`/reports/category-trends?inicio=${defaultStartPeriod}&fim=${currentPeriod}`,
		);
	}

	// Fetch all categories for the user
	const categoriaRows = await fetchUserCategories(userId);

	// Map to CategoryOption format
	const categoryOptions: CategoryOption[] = categoriaRows.map(
		(cat: Categoria): CategoryOption => ({
			id: cat.id,
			name: cat.name,
			icon: cat.icon,
			type: cat.type as "despesa" | "receita",
		}),
	);

	// Build filters for data fetching
	const filters: CategoryReportFilters = {
		startPeriod,
		endPeriod,
		categoryIds:
			selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
	};

	// Fetch report data
	const reportData = await fetchCategoryReport(userId, filters);

	// Fetch chart data with same filters
	const chartData = await fetchCategoryChartData(
		userId,
		startPeriod,
		endPeriod,
		selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
	);

	// Build initial filter state for client component
	const initialFilters: FilterState = {
		selectedCategories: selectedCategoryIds,
		startPeriod,
		endPeriod,
	};

	return (
		<main className="flex flex-col gap-6">
			<CategoryReportPage
				initialData={reportData}
				categories={categoryOptions}
				initialFilters={initialFilters}
				chartData={chartData}
			/>
		</main>
	);
}
