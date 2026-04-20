"use client";

import {
	RiListUnordered,
	RiPieChart2Line,
	RiPieChartLine,
} from "@remixicon/react";
import { useState } from "react";
import type { DashboardCategoryBreakdownData } from "@/features/dashboard/categories/category-breakdown-helpers";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { CategoryBreakdownList } from "./category-breakdown-list";

type CategoryBreakdownVariant = "income" | "expense";

type CategoryBreakdownWidgetViewProps = {
	data: DashboardCategoryBreakdownData;
	period: string;
	variant: CategoryBreakdownVariant;
};

const VARIANT_CONFIG = {
	income: {
		emptyTitle: "Nenhuma receita encontrada",
		emptyDescription:
			"Quando houver receitas registradas, elas aparecerão aqui.",
		shareLabel: "receita total",
		percentageDigits: 1,
		positiveTrend: "up",
		includeBudgetAmount: true,
	},
	expense: {
		emptyTitle: "Nenhuma despesa encontrada",
		emptyDescription:
			"Quando houver despesas registradas, elas aparecerão aqui.",
		shareLabel: "despesa total",
		percentageDigits: 0,
		positiveTrend: "down",
		includeBudgetAmount: false,
	},
} as const;

export function CategoryBreakdownWidgetView({
	data,
	period,
	variant,
}: CategoryBreakdownWidgetViewProps) {
	const [activeTab, setActiveTab] = useState<"list" | "chart">("list");
	const periodParam = formatPeriodForUrl(period);
	const config = VARIANT_CONFIG[variant];

	if (data.categories.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiPieChartLine className="size-6 text-muted-foreground" />}
				title={config.emptyTitle}
				description={config.emptyDescription}
			/>
		);
	}

	return (
		<Tabs
			value={activeTab}
			onValueChange={(value: string) => setActiveTab(value as "list" | "chart")}
			className="w-full"
		>
			<div className="flex items-center justify-between">
				<TabsList className="grid grid-cols-2">
					<TabsTrigger
						value="list"
						className="text-xs data-[state=active]:bg-transparent"
					>
						<RiListUnordered className="mr-1 size-3.5" />
						Lista
					</TabsTrigger>
					<TabsTrigger
						value="chart"
						className="text-xs data-[state=active]:bg-transparent"
					>
						<RiPieChart2Line className="mr-1 size-3.5" />
						Gráfico
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="list" className="mt-0">
				<CategoryBreakdownList
					categories={data.categories}
					periodParam={periodParam}
					config={config}
				/>
			</TabsContent>

			<TabsContent value="chart" className="mt-0">
				<CategoryBreakdownChart
					categories={data.categories}
					percentageDigits={config.percentageDigits}
				/>
			</TabsContent>
		</Tabs>
	);
}
