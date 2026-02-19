"use client";

import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiExternalLinkLine,
	RiPieChartLine,
	RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import MoneyValues from "@/components/money-values";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { ExpensesByCategoryData } from "@/lib/dashboard/categories/expenses-by-category";
import { formatPeriodForUrl } from "@/lib/utils/period";
import { WidgetEmptyState } from "../widget-empty-state";

type ExpensesByCategoryWidgetWithChartProps = {
	data: ExpensesByCategoryData;
	period: string;
};

const formatPercentage = (value: number) => {
	return `${Math.abs(value).toFixed(0)}%`;
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);

type ChartDataItem = {
	category: string;
	name: string;
	value: number;
	percentage: number;
	fill: string | undefined;
	href: string | undefined;
};

export function ExpensesByCategoryWidgetWithChart({
	data,
	period,
}: ExpensesByCategoryWidgetWithChartProps) {
	const router = useRouter();
	const isMobile = useIsMobile();
	const periodParam = formatPeriodForUrl(period);

	// Configuração do chart com cores do CSS
	const chartConfig = useMemo(() => {
		const config: ChartConfig = {};
		const colors = [
			"var(--chart-1)",
			"var(--chart-2)",
			"var(--chart-3)",
			"var(--chart-4)",
			"var(--chart-5)",
			"var(--chart-1)",
			"var(--chart-2)",
		];

		if (data.categories.length <= 7) {
			data.categories.forEach((category, index) => {
				config[category.categoryId] = {
					label: category.categoryName,
					color: colors[index % colors.length],
				};
			});
		} else {
			// Top 7 + Outros
			const top7 = data.categories.slice(0, 7);
			top7.forEach((category, index) => {
				config[category.categoryId] = {
					label: category.categoryName,
					color: colors[index % colors.length],
				};
			});
			config.outros = {
				label: "Outros",
				color: "var(--chart-6)",
			};
		}

		return config;
	}, [data.categories]);

	// Preparar dados para o gráfico de pizza - Top 7 + Outros (com href para navegação)
	const chartData = useMemo((): ChartDataItem[] => {
		const buildItem = (
			categoryId: string,
			name: string,
			value: number,
			percentage: number,
			fill: string | undefined,
		): ChartDataItem => ({
			category: categoryId,
			name,
			value,
			percentage,
			fill,
			href:
				categoryId === "outros"
					? undefined
					: `/categorias/${categoryId}?periodo=${periodParam}`,
		});

		if (data.categories.length <= 7) {
			return data.categories.map((category) =>
				buildItem(
					category.categoryId,
					category.categoryName,
					category.currentAmount,
					category.percentageOfTotal,
					chartConfig[category.categoryId]?.color,
				),
			);
		}

		const top7 = data.categories.slice(0, 7);
		const others = data.categories.slice(7);
		const othersTotal = others.reduce((sum, cat) => sum + cat.currentAmount, 0);
		const othersPercentage = others.reduce(
			(sum, cat) => sum + cat.percentageOfTotal,
			0,
		);

		const top7Data = top7.map((category) =>
			buildItem(
				category.categoryId,
				category.categoryName,
				category.currentAmount,
				category.percentageOfTotal,
				chartConfig[category.categoryId]?.color,
			),
		);
		if (others.length > 0) {
			top7Data.push(
				buildItem(
					"outros",
					"Outros",
					othersTotal,
					othersPercentage,
					chartConfig.outros?.color,
				),
			);
		}
		return top7Data;
	}, [data.categories, chartConfig, periodParam]);

	if (data.categories.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiPieChartLine className="size-6 text-muted-foreground" />}
				title="Nenhuma despesa encontrada"
				description="Quando houver despesas registradas, elas aparecerão aqui."
			/>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Gráfico de pizza (donut) — fatias clicáveis */}
			<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
				<ChartContainer
					config={chartConfig}
					className="h-[280px] w-full min-w-0 sm:h-[320px] sm:max-w-[360px]"
				>
					<PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							innerRadius="58%"
							outerRadius="92%"
							paddingAngle={2}
							dataKey="value"
							nameKey="category"
							stroke="transparent"
							onClick={(payload: ChartDataItem) => {
								if (payload?.href) router.push(payload.href);
							}}
							label={(props: {
								cx?: number;
								cy?: number;
								midAngle?: number;
								innerRadius?: number;
								outerRadius?: number;
								percent?: number;
							}) => {
								const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
								const percentage = percent * 100;
								if (percentage < 6) return null;
								const radius = (Number(innerRadius) + Number(outerRadius)) / 2;
								const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
								const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
								return (
									<text
										x={x}
										y={y}
										textAnchor="middle"
										dominantBaseline="middle"
										className="fill-foreground text-[10px] font-medium"
									>
										{formatPercentage(percentage)}
									</text>
								);
							}}
							labelLine={false}
						>
							{chartData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={entry.fill}
									className={
										entry.href
											? "cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											: ""
									}
									style={
										entry.href
											? { filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.08))" }
											: undefined
									}
								/>
							))}
						</Pie>
						{!isMobile && (
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload?.length) {
										const d = payload[0].payload as ChartDataItem;
										return (
											<div className="rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-lg">
												<div className="flex flex-col gap-1">
													<span className="text-xs font-medium text-foreground">
														{d.name}
													</span>
													<span className="text-sm font-semibold tabular-nums">
														{formatCurrency(d.value)}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{formatPercentage(d.percentage)} do total
													</span>
													{d.href && (
														<span className="mt-1 text-[10px] text-primary">
															Clique para ver detalhes
														</span>
													)}
												</div>
											</div>
										);
									}
									return null;
								}}
								cursor={false}
							/>
						)}
					</PieChart>
				</ChartContainer>

				{/* Legenda clicável */}
				<div className="flex flex-wrap gap-x-4 gap-y-2 sm:flex-1 sm:flex-col sm:gap-1.5">
					{chartData.map((entry, index) => {
						const content = (
							<>
								<span
									className="size-3 shrink-0 rounded-full ring-1 ring-border/50"
									style={{ backgroundColor: entry.fill }}
									aria-hidden
								/>
								<span className="truncate text-sm text-muted-foreground">
									{entry.name}
								</span>
								<span className="shrink-0 text-xs tabular-nums text-muted-foreground/80">
									{formatPercentage(entry.percentage)}
								</span>
							</>
						);
						return entry.href ? (
							<Link
								key={`legend-${index}`}
								href={entry.href}
								className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								{content}
							</Link>
						) : (
							<div
								key={`legend-${index}`}
								className="flex items-center gap-2 rounded-lg px-2 py-1.5"
							>
								{content}
							</div>
						);
					})}
				</div>
			</div>

			{/* Lista de categorias */}
			<div className="border-t border-dashed pt-6">
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

						return (
							<div
								key={category.categoryId}
								className="flex flex-col py-2 border-b border-dashed last:border-0"
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
													href={`/categorias/${category.categoryId}?periodo=${periodParam}`}
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
													{formatPercentage(category.percentageOfTotal)} da
													despesa total
												</span>
											</div>
										</div>
									</div>

									<div className="flex shrink-0 flex-col items-end gap-0.5">
										<MoneyValues
											className="text-foreground"
											amount={category.currentAmount}
										/>
										{category.percentageChange !== null && (
											<span
												className={`flex items-center gap-0.5 text-xs ${
													hasIncrease
														? "text-destructive"
														: hasDecrease
															? "text-success"
															: "text-muted-foreground"
												}`}
											>
												{hasIncrease && <RiArrowUpSFill className="size-3" />}
												{hasDecrease && <RiArrowDownSFill className="size-3" />}
												{formatPercentage(category.percentageChange)}
											</span>
										)}
									</div>
								</div>

								{hasBudget && category.budgetUsedPercentage !== null && (
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
													{formatPercentage(category.budgetUsedPercentage)} do
													limite - excedeu em {formatCurrency(exceededAmount)}
												</>
											) : (
												<>
													{formatPercentage(category.budgetUsedPercentage)} do
													limite
												</>
											)}
										</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
