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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";

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

const resolveLogoPath = (logo: string | null) => {
	if (!logo) return null;
	if (
		logo.startsWith("http://") ||
		logo.startsWith("https://") ||
		logo.startsWith("data:")
	) {
		return logo;
	}
	return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

export function CardUsageChart({ data, limit, card }: CardUsageChartProps) {
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatCurrencyCompact = (value: number) => {
		if (Math.abs(value) >= 1000) {
			return new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: "BRL",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
				notation: "compact",
			}).format(value);
		}
		return formatCurrency(value);
	};

	// Always show last 12 months
	const chartData = data.slice(-12).map((item) => ({
		month: item.periodLabel,
		amount: item.amount,
	}));

	const logoPath = resolveLogoPath(card.logo);

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-1.5 text-base">
						<RiBarChartBoxLine className="size-4 text-primary" />
						Histórico de Uso
					</CardTitle>

					{/* Card logo and name */}
					<div className="flex items-center gap-2">
						{logoPath ? (
							<Image
								src={logoPath}
								alt={card.name}
								width={24}
								height={24}
								className="rounded object-contain"
							/>
						) : (
							<RiBankCard2Line className="size-5 text-muted-foreground" />
						)}
						<span className="text-sm font-medium text-muted-foreground">
							{card.name}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent>
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
							tickFormatter={formatCurrencyCompact}
						/>
						{limit > 0 && (
							<ReferenceLine
								y={limit}
								stroke="#ef4444"
								strokeDasharray="3 3"
								label={{
									value: "Limite",
									position: "right",
									className: "text-xs fill-red-500",
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
													{formatCurrency(value)}
												</span>
											</div>
											{limit > 0 && (
												<div className="flex items-center justify-between gap-4">
													<span className="text-xs text-muted-foreground">
														% do Limite
													</span>
													<span className="text-xs font-medium tabular-nums">
														{usagePercent.toFixed(0)}%
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
