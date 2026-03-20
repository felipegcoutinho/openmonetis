import {
	RiArrowDownLine,
	RiArrowDownSFill,
	RiArrowUpLine,
	RiArrowUpSFill,
	RiCalendarCheckLine,
	RiScalesLine,
	RiSubtractLine,
} from "@remixicon/react";
import type { DashboardCardMetrics } from "@/features/dashboard/dashboard-metrics-queries";
import MoneyValues from "@/shared/components/money-values";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { formatPercentage } from "@/shared/utils/percentage";
import { cn } from "@/shared/utils/ui";

type DashboardMetricsCardsProps = {
	metrics: DashboardCardMetrics;
};

type Trend = "up" | "down" | "flat";

const TREND_THRESHOLD = 0.005;

const CARDS = [
	{
		label: "Receitas",
		subtitle: "Entradas do período",
		key: "receitas",
		icon: RiArrowUpLine,
		invertTrend: false,
		iconClass: "text-success",
	},
	{
		label: "Despesas",
		subtitle: "Saídas do período",
		key: "despesas",
		icon: RiArrowDownLine,
		invertTrend: true,
		iconClass: "text-destructive",
	},
	{
		label: "Balanço",
		subtitle: "Receitas menos despesas",
		key: "balanco",
		icon: RiScalesLine,
		invertTrend: false,
		iconClass: "text-warning",
	},
	{
		label: "Previsto",
		subtitle: "Saldo acumulado projetado",
		key: "previsto",
		icon: RiCalendarCheckLine,
		invertTrend: false,
		iconClass: "text-primary",
	},
] as const;

const TREND_ICONS = {
	up: RiArrowUpSFill,
	down: RiArrowDownSFill,
	flat: RiSubtractLine,
} as const;

const getTrend = (current: number, previous: number): Trend => {
	const diff = current - previous;
	if (diff > TREND_THRESHOLD) return "up";
	if (diff < -TREND_THRESHOLD) return "down";
	return "flat";
};

const getPercentChange = (current: number, previous: number): string => {
	const EPSILON = 0.01;

	if (Math.abs(previous) < EPSILON) {
		if (Math.abs(current) < EPSILON) return "0%";
		return "—";
	}

	const change = ((current - previous) / Math.abs(previous)) * 100;
	return Number.isFinite(change) && Math.abs(change) < 1000000
		? formatPercentage(change, {
				maximumFractionDigits: 1,
				minimumFractionDigits: 1,
				signDisplay: "always",
			})
		: "—";
};

const getTrendBadgeClass = (trend: Trend, invertTrend: boolean): string => {
	if (trend === "flat") return "text-muted-foreground";
	const isPositive = invertTrend ? trend === "down" : trend === "up";
	return isPositive ? "text-success" : "text-destructive";
};

export function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
	return (
		<div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{CARDS.map(
				({ label, subtitle, key, icon: Icon, invertTrend, iconClass }) => {
					const metric = metrics[key];
					const trend = getTrend(metric.current, metric.previous);
					const TrendIcon = TREND_ICONS[trend];
					const trendBadgeClass = getTrendBadgeClass(trend, invertTrend);
					const percentChange = getPercentChange(
						metric.current,
						metric.previous,
					);

					return (
						<Card key={label} className="gap-2 overflow-hidden">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="flex items-center gap-1 tracking-tight">
											<Icon className={cn("size-4", iconClass)} aria-hidden />
											{label}
										</CardTitle>
										<CardDescription className="mt-1.5 tracking-tight">
											{subtitle}
										</CardDescription>
									</div>
								</div>
								<Separator className="mt-1" />
							</CardHeader>

							<CardContent className="flex flex-col gap-3">
								<div className="flex flex-wrap items-center justify-between gap-2 mt-1">
									<MoneyValues
										className="text-[1.55rem] leading-none font-medium"
										amount={metric.current}
									/>
									<div
										className={cn(
											"inline-flex items-center gap-1 text-xs font-medium",
											trendBadgeClass,
										)}
									>
										<TrendIcon className="size-3.5" aria-hidden />
										<span>{percentChange}</span>
									</div>
								</div>

								<div className="text-xs text-muted-foreground">
									<MoneyValues
										className="inline text-xs font-medium text-muted-foreground"
										amount={metric.previous}
									/>
									<span className="ml-1">no mês anterior</span>
								</div>
							</CardContent>
						</Card>
					);
				},
			)}
		</div>
	);
}
