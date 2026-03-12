"use client";

import { RiBankCard2Line, RiBarChartBoxLine } from "@remixicon/react";
import Image from "next/image";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";
import type { CardDetailData } from "@/features/reports/cards-report-queries";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/shared/components/ui/chart";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatCurrency, formatCurrencyCompact } from "@/shared/utils/currency";
import { formatPercentage } from "@/shared/utils/percentage";

type CardUsageChartProps = {
	data: CardDetailData["monthlyUsage"];
	limit: number;
	card: {
		name: string;
		logo: string | null;
	};
};

const chartConfig = {
	amount: {
		label: "Uso",
		color: "#3b82f6",
	},
} satisfies ChartConfig;

export function CardUsageChart({ data, limit, card }: CardUsageChartProps) {
	// Always show last 12 months
	const chartData = data.slice(-12).map((item) => ({
		month: item.periodLabel,
		amount: item.amount,
	}));

	const logoPath = resolveLogoSrc(card.logo);

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="flex items-center gap-1.5 text-base">
						<RiBarChartBoxLine className="size-4 text-primary" />
						Histórico de Uso
					</CardTitle>

					{/* Card logo and name */}
					<div className="flex min-w-0 items-center gap-2">
						{logoPath ? (
							<Image
								src={logoPath}
								alt={card.name}
								width={24}
								height={24}
								className="rounded-full object-contain"
							/>
						) : (
							<RiBankCard2Line className="size-5 text-muted-foreground" />
						)}
						<span className="max-w-24 truncate text-sm font-medium text-muted-foreground sm:max-w-none">
							{card.name}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:px-6">
				<ChartContainer config={chartConfig} className="h-[280px] w-full">
					<BarChart
						data={chartData}
						margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-xs"
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-xs"
							tickFormatter={(value) =>
								Math.abs(Number(value)) >= 1000
									? formatCurrencyCompact(Number(value), {
											maximumFractionDigits: 0,
											minimumFractionDigits: 0,
										})
									: formatCurrency(Number(value), {
											maximumFractionDigits: 0,
											minimumFractionDigits: 0,
										})
							}
						/>
						{limit > 0 && (
							<ReferenceLine
								y={limit}
								stroke="#ef4444"
								strokeDasharray="3 3"
								label={{
									value: "Limite",
									position: "right",
									className: "text-xs fill-destructive",
								}}
							/>
						)}
						<ChartTooltip
							content={({ active, payload }) => {
								if (!active || !payload || payload.length === 0) {
									return null;
								}

								const data = payload[0].payload;
								const value = data.amount as number;
								const usagePercent = limit > 0 ? (value / limit) * 100 : 0;

								return (
									<div className="rounded-lg border bg-background p-3 shadow-lg">
										<div className="mb-2 text-xs font-medium text-muted-foreground">
											{data.month}
										</div>
										<div className="space-y-1">
											<div className="flex items-center justify-between gap-4">
												<span className="text-xs text-muted-foreground">
													Uso
												</span>
												<span className="text-xs font-medium tabular-nums">
													{formatCurrency(value, {
														maximumFractionDigits: 0,
														minimumFractionDigits: 0,
													})}
												</span>
											</div>
											{limit > 0 && (
												<div className="flex items-center justify-between gap-4">
													<span className="text-xs text-muted-foreground">
														% do Limite
													</span>
													<span className="text-xs font-medium tabular-nums">
														{formatPercentage(usagePercent, {
															maximumFractionDigits: 0,
															minimumFractionDigits: 0,
														})}
													</span>
												</div>
											)}
										</div>
									</div>
								);
							}}
							cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
						/>
						<Bar
							dataKey="amount"
							fill="var(--primary)"
							radius={[4, 4, 0, 0]}
							maxBarSize={50}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
