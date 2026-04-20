"use client";

import { useMemo } from "react";
import { Pie, PieChart, Tooltip } from "recharts";
import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { type ChartConfig, ChartContainer } from "@/shared/components/ui/chart";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPercentage as formatPercentageValue } from "@/shared/utils/percentage";

const CATEGORY_BREAKDOWN_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-1)",
	"var(--chart-2)",
];

const formatPercentage = (value: number, digits: number) =>
	formatPercentageValue(value, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
		absolute: true,
	});

type CategoryBreakdownChartProps = {
	categories: DashboardCategoryBreakdownItem[];
	percentageDigits: number;
};

export function CategoryBreakdownChart({
	categories,
	percentageDigits,
}: CategoryBreakdownChartProps) {
	const chartConfig = useMemo(() => {
		const nextConfig: ChartConfig = {};

		const topCategories = categories.slice(0, 7);
		topCategories.forEach((category, index) => {
			nextConfig[category.categoryId] = {
				label: category.categoryName,
				color:
					CATEGORY_BREAKDOWN_COLORS[index % CATEGORY_BREAKDOWN_COLORS.length],
			};
		});

		if (categories.length > 7) {
			nextConfig.outros = { label: "Outros", color: "var(--chart-6)" };
		}

		return nextConfig;
	}, [categories]);

	const chartData = useMemo(() => {
		if (categories.length <= 7) {
			return categories.map((category) => ({
				category: category.categoryId,
				name: category.categoryName,
				value: category.currentAmount,
				percentage: category.percentageOfTotal,
				fill: chartConfig[category.categoryId]?.color,
			}));
		}

		const topCategories = categories.slice(0, 7);
		const otherCategories = categories.slice(7);
		const otherTotal = otherCategories.reduce(
			(sum, c) => sum + c.currentAmount,
			0,
		);
		const otherPercentage = otherCategories.reduce(
			(sum, c) => sum + c.percentageOfTotal,
			0,
		);

		const groupedData = topCategories.map((category) => ({
			category: category.categoryId,
			name: category.categoryName,
			value: category.currentAmount,
			percentage: category.percentageOfTotal,
			fill: chartConfig[category.categoryId]?.color,
		}));

		if (otherCategories.length > 0) {
			groupedData.push({
				category: "outros",
				name: "Outros",
				value: otherTotal,
				percentage: otherPercentage,
				fill: chartConfig.outros?.color,
			});
		}

		return groupedData;
	}, [categories, chartConfig]);

	return (
		<div className="flex items-center gap-4">
			<ChartContainer config={chartConfig} className="h-[280px] flex-1">
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={({ payload }) =>
							formatPercentage(
								(payload as { percentage?: number } | undefined)?.percentage ??
									0,
								percentageDigits,
							)
						}
						outerRadius={75}
						dataKey="value"
						nameKey="category"
					/>
					<Tooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const entry = payload[0]?.payload;
							if (!entry) return null;
							return (
								<div className="rounded-lg border bg-background p-2 shadow-sm">
									<div className="grid gap-2">
										<div className="flex flex-col">
											<span className="text-xs uppercase text-muted-foreground">
												{entry.name}
											</span>
											<span className="font-medium text-foreground">
												{formatCurrency(entry.value)}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatPercentage(entry.percentage, percentageDigits)}{" "}
												do total
											</span>
										</div>
									</div>
								</div>
							);
						}}
					/>
				</PieChart>
			</ChartContainer>

			<div className="min-w-[140px] flex flex-col gap-2">
				{chartData.map((entry, index) => (
					<div key={`legend-${index}`} className="flex items-center gap-2">
						<div
							className="size-3 shrink-0 rounded-sm"
							style={{ backgroundColor: entry.fill }}
						/>
						<span className="truncate text-xs text-muted-foreground">
							{entry.name}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
