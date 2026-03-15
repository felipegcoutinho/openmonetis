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
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { formatPercentage } from "@/shared/utils/percentage";

type DashboardMetricsCardsProps = {
	metrics: DashboardCardMetrics;
};

type Trend = "up" | "down" | "flat";

const TREND_THRESHOLD = 0.005;

const CARDS = [
	{
		label: "Receitas",
		key: "receitas",
		icon: RiArrowUpLine,
		invertTrend: false,
		cardClass: "",
		iconClass: "text-success",
	},
	{
		label: "Despesas",
		key: "despesas",
		icon: RiArrowDownLine,
		invertTrend: true,
		cardClass: "",
		iconClass: "text-destructive",
	},
	{
		label: "Balanço",
		key: "balanco",
		icon: RiScalesLine,
		invertTrend: false,
		cardClass: "",
		iconClass: "text-amber-500",
	},
	{
		label: "Previsto",
		key: "previsto",
		icon: RiCalendarCheckLine,
		invertTrend: false,
		cardClass: "border border-dashed",
		iconClass: "",
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

const getTrendColor = (trend: Trend, invertTrend: boolean): string => {
	if (trend === "flat") return "text-muted-foreground";
	const isPositive = invertTrend ? trend === "down" : trend === "up";
	return isPositive ? "text-success" : "text-destructive";
};

export function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
	return (
		<div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{CARDS.map(
				({ label, key, icon: Icon, invertTrend, cardClass, iconClass }) => {
					const metric = metrics[key];
					const trend = getTrend(metric.current, metric.previous);
					const TrendIcon = TREND_ICONS[trend];
					const trendColor = getTrendColor(trend, invertTrend);

					return (
						<Card
							key={label}
							className={`@container/card flex flex-col justify-between min-h-34 ${cardClass}`}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-1 tracking-tight lowercase">
									<Icon className={`size-4 ${iconClass}`} />
									{label}
								</CardTitle>
								<div className="flex items-baseline gap-2 mt-auto pt-2">
									<MoneyValues className="text-2xl" amount={metric.current} />
									<div className={`flex items-center text-xs ${trendColor}`}>
										<TrendIcon size={14} />
										{getPercentChange(metric.current, metric.previous)}
									</div>
								</div>
							</CardHeader>
							<CardFooter className="text-sm">
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<span>vs. mês anterior</span>
									<MoneyValues amount={metric.previous} />
								</div>
							</CardFooter>
						</Card>
					);
				},
			)}
		</div>
	);
}
