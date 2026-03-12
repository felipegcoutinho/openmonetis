"use client";
import {
	RiFilter3Line,
	RiLineChartLine,
	RiPieChartLine,
	RiTable2,
} from "@remixicon/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CategoryChartData } from "@/features/reports/category-chart-queries";
import { EmptyState } from "@/shared/components/empty-state";
import { CategoryReportSkeleton } from "@/shared/components/skeletons/category-report-skeleton";
import { Card } from "@/shared/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { CategoryReportData } from "@/shared/lib/types/reports";
import { CategoryReportCards } from "./category-report-cards";
import { CategoryReportChart } from "./category-report-chart";
import { CategoryReportExport } from "./category-report-export";
import { CategoryReportFilters } from "./category-report-filters";
import { CategoryReportTable } from "./category-report-table";
import type { CategoryOption, FilterState } from "./types";

interface CategoryReportPageProps {
	initialData: CategoryReportData;
	categories: CategoryOption[];
	initialFilters: FilterState;
	chartData: CategoryChartData;
}

export function CategoryReportPage({
	initialData,
	categories,
	initialFilters,
	chartData,
}: CategoryReportPageProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const [filters, setFilters] = useState<FilterState>(initialFilters);

	// Get active tab from URL or default to "table"
	const activeTab = searchParams.get("aba") || "table";

	// Debounce timer
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	const handleFiltersChange = (newFilters: FilterState) => {
		setFilters(newFilters);

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				params.set("inicio", newFilters.startPeriod);
				params.set("fim", newFilters.endPeriod);

				if (newFilters.selectedCategories.length > 0) {
					params.set("categorias", newFilters.selectedCategories.join(","));
				} else {
					params.delete("categorias");
				}

				const currentTab = searchParams.get("aba");
				if (currentTab) {
					params.set("aba", currentTab);
				}

				router.push(`?${params.toString()}`, { scroll: false });
			});
		}, 300);
	};

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("aba", value);
		router.push(`?${params.toString()}`, { scroll: false });
	};

	// Check if no categories are available
	const hasNoCategories = categories.length === 0;

	// Check if no data in period
	const hasNoData = initialData.categories.length === 0 && !hasNoCategories;

	return (
		<div className="flex flex-col gap-6">
			{/* Filters */}
			<CategoryReportFilters
				categories={categories}
				filters={filters}
				onFiltersChange={handleFiltersChange}
				exportButton={
					<CategoryReportExport data={initialData} filters={filters} />
				}
			/>

			{/* Loading State */}
			{isPending && <CategoryReportSkeleton />}

			{/* Empty States */}
			{!isPending && hasNoCategories && (
				<Card className="flex w-full items-center justify-center py-12">
					<EmptyState
						title="Nenhuma categoria cadastrada"
						description="Você precisa cadastrar categorias antes de visualizar o relatório."
						media={<RiPieChartLine className="size-6 text-primary" />}
					/>
				</Card>
			)}

			{!isPending &&
				!hasNoCategories &&
				hasNoData &&
				filters.selectedCategories.length === 0 && (
					<Card className="flex w-full items-center justify-center py-12">
						<EmptyState
							title="Selecione pelo menos uma categoria"
							description="Use o filtro acima para selecionar as categorias que deseja visualizar no relatório."
							media={<RiFilter3Line className="size-6 text-primary" />}
						/>
					</Card>
				)}

			{!isPending &&
				!hasNoCategories &&
				hasNoData &&
				filters.selectedCategories.length > 0 && (
					<Card className="flex w-full items-center justify-center py-12">
						<EmptyState
							title="Nenhum lançamento encontrado"
							description="Não há transações no período selecionado para as categorias filtradas."
							media={<RiPieChartLine className="size-6 text-primary" />}
						/>
					</Card>
				)}

			{/* Tabs: Table and Chart */}
			{!isPending && !hasNoCategories && !hasNoData && (
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="table">
							<RiTable2 className="h-4 w-4 mr-2" />
							Tabela
						</TabsTrigger>
						<TabsTrigger value="chart">
							<RiLineChartLine className="h-4 w-4 mr-2" />
							Gráfico
						</TabsTrigger>
					</TabsList>

					<TabsContent value="table" className="mt-4">
						{/* Desktop Table */}
						<div className="hidden md:block">
							<CategoryReportTable data={initialData} />
						</div>

						{/* Mobile Cards */}
						<CategoryReportCards data={initialData} />
					</TabsContent>

					<TabsContent value="chart" className="mt-4">
						<CategoryReportChart data={chartData} />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
