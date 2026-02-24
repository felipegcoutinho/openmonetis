"use client";

import { RiPieChartLine } from "@remixicon/react";
import * as React from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	type TooltipProps,
	XAxis,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { currencyFormatter } from "@/lib/lancamentos/formatting-helpers";
import type { CategoryChartData } from "@/lib/relatorios/fetch-category-chart-data";
import { CATEGORY_COLORS } from "@/lib/utils/category-colors";

function AreaTooltip({ active, payload, label }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;

	const items = payload
		.filter((entry) => Number(entry.value) > 0)
		.sort((a, b) => Number(b.value) - Number(a.value));

	if (items.length === 0) return null;

	return (
		<div className="min-w-[210px] rounded-lg border border-border/50 bg-background px-3 py-2.5 shadow-xl">
			<p className="mb-2.5 border-b border-border/50 pb-1.5 text-xs font-semibold text-foreground">
				{label}
			</p>
			<div className="space-y-1.5">
				{items.map((entry) => (
					<div
						key={entry.dataKey}
						className="flex items-center justify-between gap-6"
					>
						<div className="flex min-w-0 items-center gap-1.5">
							<span
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="truncate text-xs text-muted-foreground">
								{entry.name}
							</span>
						</div>
						<span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
							{currencyFormatter.format(Number(entry.value))}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

interface CategoryReportChartProps {
	data: CategoryChartData;
}

const LIMIT_OPTIONS = [
	{ value: "5", label: "Top 5" },
	{ value: "10", label: "Top 10" },
	{ value: "15", label: "Top 15" },
] as const;

const MAX_CATEGORIES = 15;

export function CategoryReportChart({ data }: CategoryReportChartProps) {
	const { chartData, categories } = data;
	const [limit, setLimit] = React.useState("10");

	const { topCategories, filteredChartData } = React.useMemo(() => {
		const limitNum = Math.min(Number(limit), MAX_CATEGORIES);

		const categoriesWithTotal = categories.map((category) => ({
			...category,
			total: chartData.reduce((sum, point) => {
				const v = point[category.name];
				return sum + (typeof v === "number" ? v : 0);
			}, 0),
		}));

		const sorted = categoriesWithTotal
			.sort((a, b) => b.total - a.total)
			.slice(0, limitNum);

		const filtered = chartData.map((point) => {
			const result: { month: string; [key: string]: number | string } = {
				month: point.month,
			};
			for (const cat of sorted) {
				result[cat.name] = (point[cat.name] as number) ?? 0;
			}
			return result;
		});

		return { topCategories: sorted, filteredChartData: filtered };
	}, [categories, chartData, limit]);

	const chartConfig = React.useMemo<ChartConfig>(() => {
		const config: ChartConfig = {};
		for (let i = 0; i < topCategories.length; i++) {
			const cat = topCategories[i];
			config[cat.name] = {
				label: cat.name,
				color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
			};
		}
		return config;
	}, [topCategories]);

	if (categories.length === 0 || chartData.length === 0) {
		return (
			<EmptyState
				title="Nenhum dado disponível"
				description="Não há transações no período selecionado para as categorias filtradas."
				media={<RiPieChartLine className="h-12 w-12" />}
				mediaVariant="icon"
			/>
		);
	}

	const firstMonth = chartData[0]?.month ?? "";
	const lastMonth = chartData[chartData.length - 1]?.month ?? "";
	const periodLabel =
		firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`;

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>Evolução por Categoria</CardTitle>
					<CardDescription>{periodLabel}</CardDescription>
				</div>
				<Select value={limit} onValueChange={setLimit}>
					<SelectTrigger
						className="hidden w-[130px] rounded-lg sm:ml-auto sm:flex"
						aria-label="Número de categorias"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						{LIMIT_OPTIONS.map((opt) => (
							<SelectItem
								key={opt.value}
								value={opt.value}
								className="rounded-lg"
							>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</CardHeader>

			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[300px] w-full"
				>
					<AreaChart data={filteredChartData}>
						<defs>
							{topCategories.map((cat, index) => {
								const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
								return (
									<linearGradient
										key={cat.id}
										id={`fill-${cat.id}`}
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor={color} stopOpacity={0.8} />
										<stop offset="95%" stopColor={color} stopOpacity={0.1} />
									</linearGradient>
								);
							})}
						</defs>

						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
						/>

						<ChartTooltip cursor={false} content={<AreaTooltip />} />

						{topCategories.map((cat, index) => (
							<Area
								key={cat.id}
								dataKey={cat.name}
								type="natural"
								fill={`url(#fill-${cat.id})`}
								stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
								strokeWidth={1.5}
								stackId="a"
							/>
						))}

						<ChartLegend content={<ChartLegendContent />} />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
