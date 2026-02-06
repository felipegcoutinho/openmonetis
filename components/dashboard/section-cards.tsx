import {
	RiArrowDownLine,
	RiArrowUpLine,
	RiCurrencyLine,
	RiIncreaseDecreaseLine,
	RiSubtractLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { DashboardCardMetrics } from "@/lib/dashboard/metrics";
import MoneyValues from "../money-values";

type SectionCardsProps = {
	metrics: DashboardCardMetrics;
};

type Trend = "up" | "down" | "flat";

const TREND_THRESHOLD = 0.005;

const CARDS = [
	{ label: "Receitas", key: "receitas", icon: RiArrowUpLine },
	{ label: "Despesas", key: "despesas", icon: RiArrowDownLine },
	{ label: "Balanço", key: "balanco", icon: RiIncreaseDecreaseLine },
	{ label: "Previsto", key: "previsto", icon: RiCurrencyLine },
] as const;

const TREND_ICONS = {
	up: RiArrowUpLine,
	down: RiArrowDownLine,
	flat: RiSubtractLine,
} as const;

const getTrend = (current: number, previous: number): Trend => {
	const diff = current - previous;
	if (diff > TREND_THRESHOLD) return "up";
	if (diff < -TREND_THRESHOLD) return "down";
	return "flat";
};

const getPercentChange = (current: number, previous: number): string => {
	const EPSILON = 0.01; // Considera valores menores que 1 centavo como zero

	if (Math.abs(previous) < EPSILON) {
		if (Math.abs(current) < EPSILON) return "0%";
		return "—";
	}

	const change = ((current - previous) / Math.abs(previous)) * 100;
	return Number.isFinite(change) && Math.abs(change) < 1000000
		? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
		: "—";
};

export function SectionCards({ metrics }: SectionCardsProps) {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{CARDS.map(({ label, key, icon: Icon }) => {
				const metric = metrics[key];
				const trend = getTrend(metric.current, metric.previous);
				const TrendIcon = TREND_ICONS[trend];

				return (
					<Card key={label} className="@container/card gap-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-1">
								<Icon className="size-4 text-primary" />
								{label}
							</CardTitle>
							<MoneyValues className="text-2xl" amount={metric.current} />
							<CardAction>
								<Badge variant="outline">
									<TrendIcon />
									{getPercentChange(metric.current, metric.previous)}
								</Badge>
							</CardAction>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-2 text-sm">
							<div className="line-clamp-1 flex gap-2 text-xs">
								Mês anterior
							</div>
							<div className="text-muted-foreground">
								<MoneyValues amount={metric.previous} />
							</div>
						</CardFooter>
					</Card>
				);
			})}
		</div>
	);
}
