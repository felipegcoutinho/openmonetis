"use client";

import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiExternalLinkLine,
	RiListUnordered,
	RiPieChart2Line,
	RiPieChartLine,
	RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Pie, PieChart, Tooltip } from "recharts";
import { CategoryIconBadge } from "@/features/categories/components/category-icon-badge";
import type { DashboardCategoryBreakdownData } from "@/features/dashboard/categories/category-breakdown";
import MoneyValues from "@/shared/components/money-values";
import { type ChartConfig, ChartContainer } from "@/shared/components/ui/chart";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPercentage as formatPercentageValue } from "@/shared/utils/percentage";
import { formatPeriodForUrl } from "@/shared/utils/period";

type CategoryBreakdownVariant = "income" | "expense";

type CategoryBreakdownWidgetViewProps = {
	data: DashboardCategoryBreakdownData;
	period: string;
	variant: CategoryBreakdownVariant;
};

const CATEGORY_BREAKDOWN_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-1)",
	"var(--chart-2)",
];

const VARIANT_CONFIG = {
	income: {
		emptyTitle: "Nenhuma receita encontrada",
		emptyDescription:
			"Quando houver receitas registradas, elas aparecerão aqui.",
		shareLabel: "receita total",
		percentageDigits: 1,
		changeClassName: {
			increase: "text-success",
			decrease: "text-destructive",
		},
		listItemClassName:
			"flex flex-col gap-1.5 py-2 border-b border-dashed last:border-0",
		includeBudgetAmount: true,
	},
	expense: {
		emptyTitle: "Nenhuma despesa encontrada",
		emptyDescription:
			"Quando houver despesas registradas, elas aparecerão aqui.",
		shareLabel: "despesa total",
		percentageDigits: 0,
		changeClassName: {
			increase: "text-destructive",
			decrease: "text-success",
		},
		listItemClassName:
			"flex flex-col py-2 border-b border-dashed last:border-0",
		includeBudgetAmount: false,
	},
} as const;

const formatPercentage = (value: number, digits: number) =>
	formatPercentageValue(value, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
		absolute: true,
	});

export function CategoryBreakdownWidgetView({
	data,
	period,
	variant,
}: CategoryBreakdownWidgetViewProps) {
	const [activeTab, setActiveTab] = useState<"list" | "chart">("list");
	const periodParam = formatPeriodForUrl(period);
	const config = VARIANT_CONFIG[variant];

	const chartConfig = useMemo(() => {
		const nextConfig: ChartConfig = {};

		if (data.categories.length <= 7) {
			data.categories.forEach((category, index) => {
				nextConfig[category.categoryId] = {
					label: category.categoryName,
					color:
						CATEGORY_BREAKDOWN_COLORS[index % CATEGORY_BREAKDOWN_COLORS.length],
				};
			});
		} else {
			const topCategories = data.categories.slice(0, 7);
			topCategories.forEach((category, index) => {
				nextConfig[category.categoryId] = {
					label: category.categoryName,
					color:
						CATEGORY_BREAKDOWN_COLORS[index % CATEGORY_BREAKDOWN_COLORS.length],
				};
			});
			nextConfig.outros = {
				label: "Outros",
				color: "var(--chart-6)",
			};
		}

		return nextConfig;
	}, [data.categories]);

	const chartData = useMemo(() => {
		if (data.categories.length <= 7) {
			return data.categories.map((category) => ({
				category: category.categoryId,
				name: category.categoryName,
				value: category.currentAmount,
				percentage: category.percentageOfTotal,
				fill: chartConfig[category.categoryId]?.color,
			}));
		}

		const topCategories = data.categories.slice(0, 7);
		const otherCategories = data.categories.slice(7);
		const otherTotal = otherCategories.reduce(
			(sum, category) => sum + category.currentAmount,
			0,
		);
		const otherPercentage = otherCategories.reduce(
			(sum, category) => sum + category.percentageOfTotal,
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
	}, [data.categories, chartConfig]);

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
					<TabsTrigger value="list" className="text-xs">
						<RiListUnordered className="mr-1 size-3.5" />
						Lista
					</TabsTrigger>
					<TabsTrigger value="chart" className="text-xs">
						<RiPieChart2Line className="mr-1 size-3.5" />
						Gráfico
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="list" className="mt-0">
				<div className="flex flex-col px-0">
					{data.categories.map((category, index) => {
						const hasIncrease =
							category.percentageChange !== null &&
							category.percentageChange > 0;
						const hasDecrease =
							category.percentageChange !== null &&
							category.percentageChange < 0;
						const hasBudget = category.budgetAmount !== null;
						const budgetExceeded =
							hasBudget &&
							category.budgetUsedPercentage !== null &&
							category.budgetUsedPercentage > 100;
						const exceededAmount =
							budgetExceeded && category.budgetAmount
								? category.currentAmount - category.budgetAmount
								: 0;
						const changeClassName = hasIncrease
							? config.changeClassName.increase
							: hasDecrease
								? config.changeClassName.decrease
								: "text-muted-foreground";

						return (
							<div
								key={category.categoryId}
								className={config.listItemClassName}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<CategoryIconBadge
											icon={category.categoryIcon}
											name={category.categoryName}
											colorIndex={index}
										/>

										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<Link
													href={`/categories/${category.categoryId}?periodo=${periodParam}`}
													className="flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
												>
													<span className="truncate">
														{category.categoryName}
													</span>
													<RiExternalLinkLine
														className="size-3 shrink-0 text-muted-foreground"
														aria-hidden
													/>
												</Link>
											</div>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<span>
													{formatPercentage(
														category.percentageOfTotal,
														config.percentageDigits,
													)}{" "}
													da {config.shareLabel}
												</span>
											</div>
										</div>
									</div>

									<div className="flex shrink-0 flex-col items-end gap-0.5">
										<MoneyValues
											className="text-foreground"
											amount={category.currentAmount}
										/>
										{category.percentageChange !== null ? (
											<span
												className={`flex items-center gap-0.5 text-xs ${changeClassName}`}
											>
												{hasIncrease ? (
													<RiArrowUpSFill className="size-3" />
												) : null}
												{hasDecrease ? (
													<RiArrowDownSFill className="size-3" />
												) : null}
												{formatPercentage(
													category.percentageChange,
													config.percentageDigits,
												)}
											</span>
										) : null}
									</div>
								</div>

								{hasBudget && category.budgetUsedPercentage !== null ? (
									<div className="ml-11 flex items-center gap-1.5 text-xs">
										<RiWallet3Line
											className={`size-3 ${
												budgetExceeded ? "text-destructive" : "text-info"
											}`}
										/>
										<span
											className={
												budgetExceeded ? "text-destructive" : "text-info"
											}
										>
											{budgetExceeded ? (
												<>
													{formatPercentage(
														category.budgetUsedPercentage,
														config.percentageDigits,
													)}{" "}
													do limite
													{config.includeBudgetAmount &&
													category.budgetAmount !== null
														? ` ${formatCurrency(category.budgetAmount)}`
														: ""}{" "}
													- excedeu em {formatCurrency(exceededAmount)}
												</>
											) : (
												<>
													{formatPercentage(
														category.budgetUsedPercentage,
														config.percentageDigits,
													)}{" "}
													do limite
													{config.includeBudgetAmount &&
													category.budgetAmount !== null
														? ` ${formatCurrency(category.budgetAmount)}`
														: ""}
												</>
											)}
										</span>
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</TabsContent>

			<TabsContent value="chart" className="mt-0">
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
										(payload as { percentage?: number } | undefined)
											?.percentage ?? 0,
										config.percentageDigits,
									)
								}
								outerRadius={75}
								dataKey="value"
								nameKey="category"
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (!active || !payload?.length) {
										return null;
									}

									const entry = payload[0]?.payload;
									if (!entry) {
										return null;
									}

									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<div className="grid gap-2">
												<div className="flex flex-col">
													<span className="text-[0.70rem] uppercase text-muted-foreground">
														{entry.name}
													</span>
													<span className="font-bold text-foreground">
														{formatCurrency(entry.value)}
													</span>
													<span className="text-xs text-muted-foreground">
														{formatPercentage(
															entry.percentage,
															config.percentageDigits,
														)}{" "}
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
			</TabsContent>
		</Tabs>
	);
}
