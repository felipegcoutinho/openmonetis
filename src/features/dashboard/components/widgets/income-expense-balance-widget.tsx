"use client";

import { RiLineChartLine } from "@remixicon/react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	XAxis,
} from "recharts";
import type { IncomeExpenseBalanceData } from "@/features/dashboard/overview/income-expense-balance-queries";
import { CardContent } from "@/shared/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/shared/components/ui/chart";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { formatCurrency } from "@/shared/utils/currency";
import { formatCompactPeriodLabel } from "@/shared/utils/period";

type IncomeExpenseBalanceWidgetProps = {
	data: IncomeExpenseBalanceData;
};

const chartConfig = {
	receita: {
		label: "Receita",
		color: "var(--success)",
	},
	despesa: {
		label: "Despesa",
		color: "var(--destructive)",
	},
	balanco: {
		label: "Balanço",
		color: "var(--primary)",
	},
} satisfies ChartConfig;

export function IncomeExpenseBalanceWidget({
	data,
}: IncomeExpenseBalanceWidgetProps) {
	const chartData = data.months.map((month) => ({
		month: formatCompactPeriodLabel(month.month).toLowerCase(),
		receita: month.income,
		despesa: month.expense,
		balanco: month.balance,
	}));

	// Verifica se todos os valores são zero
	const isEmpty = chartData.every(
		(item) => item.receita === 0 && item.despesa === 0 && item.balanco === 0,
	);

	if (isEmpty) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiLineChartLine className="size-6 text-muted-foreground" />}
					title="Nenhuma movimentação financeira no período"
					description="Registre receitas e despesas para visualizar o balanço mensal."
				/>
			</CardContent>
		);
	}

	return (
		<CardContent className="space-y-2 px-0">
			<ChartContainer
				config={chartConfig}
				className="h-[270px] w-full aspect-auto"
			>
				<ComposedChart
					data={chartData}
					margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
					accessibilityLayer
				>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<ReferenceLine y={0} stroke="var(--border)" />
					<XAxis
						dataKey="month"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload || payload.length === 0) {
								return null;
							}

							const month = payload[0]?.payload.month as string | undefined;

							return (
								<div className="rounded-lg border bg-background p-2 shadow-sm">
									{month ? (
										<p className="mb-2 text-xs font-medium text-muted-foreground">
											{month}
										</p>
									) : null}
									<div className="grid gap-2">
										{payload.map((entry) => {
											const config =
												chartConfig[entry.dataKey as keyof typeof chartConfig];
											const value = entry.value as number;

											return (
												<div
													key={String(entry.dataKey ?? entry.name)}
													className="flex items-center gap-2"
												>
													<div
														className="size-2 rounded-full"
														style={{ backgroundColor: config?.color }}
													/>
													<span className="text-xs text-muted-foreground">
														{config?.label}:
													</span>
													<span className="text-xs font-medium">
														{formatCurrency(value)}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							);
						}}
						cursor={{ fill: "var(--muted)", opacity: 0.3 }}
					/>
					<Bar
						dataKey="receita"
						fill={chartConfig.receita.color}
						radius={[4, 4, 0, 0]}
						maxBarSize={60}
					/>
					<Bar
						dataKey="despesa"
						fill={chartConfig.despesa.color}
						radius={[4, 4, 0, 0]}
						maxBarSize={60}
					/>
					<Line
						dataKey="balanco"
						type="monotone"
						stroke={chartConfig.balanco.color}
						strokeWidth={2}
						dot={{ fill: chartConfig.balanco.color, r: 3 }}
						activeDot={{ r: 5 }}
					/>
				</ComposedChart>
			</ChartContainer>
			<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
				{Object.values(chartConfig).map((config) => (
					<div key={config.label} className="flex items-center gap-1.5">
						<div
							className="size-2 rounded-full"
							style={{ backgroundColor: config.color }}
						/>
						<span>{config.label}</span>
					</div>
				))}
			</div>
		</CardContent>
	);
}
