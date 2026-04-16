import {
	RiArrowDownLine,
	RiArrowDownSFill,
	RiArrowUpLine,
	RiArrowUpSFill,
	RiCalendarCheckLine,
	RiScalesLine,
	RiSubtractLine,
} from "@remixicon/react";
import { MetricsCardInfoButton } from "@/features/dashboard/components/metrics-card-info-button";
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
		icon: RiArrowDownLine,
		invertTrend: false,
		iconClass: "text-success",
		helpTitle: "Como calculamos receitas",
		helpLines: [
			"Somamos os lançamentos do tipo Receita no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados do pagador principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"Saldo inicial também fica fora quando a conta está marcada para desconsiderá-lo das receitas.",
		],
	},
	{
		label: "Despesas",
		subtitle: "Saídas do período",
		key: "despesas",
		icon: RiArrowUpLine,
		invertTrend: true,
		iconClass: "text-destructive",
		helpTitle: "Como calculamos despesas",
		helpLines: [
			"Somamos os lançamentos do tipo Despesa no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados do pagador principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"O valor mostrado é a saída efetiva do período, sempre em número positivo no card.",
		],
	},
	{
		label: "Balanço",
		subtitle: "Receitas, despesas e ajustes entre contas",
		key: "balanco",
		icon: RiScalesLine,
		invertTrend: false,
		iconClass: "text-warning",
		helpTitle: "Como calculamos o balanço",
		helpLines: [
			"Partimos de receitas menos despesas do período.",
			"Receitas e despesas de contas marcadas como não consideradas no saldo total ficam fora do cálculo base.",
			"Depois aplicamos ajustes de transferências entre contas consideradas e não consideradas no saldo total.",
			"Se a transferência entra em conta considerada, soma. Se sai de conta considerada para conta não considerada, subtrai.",
		],
	},
	{
		label: "Previsto",
		subtitle: "Saldo acumulado projetado",
		key: "previsto",
		icon: RiCalendarCheckLine,
		invertTrend: false,
		iconClass: "text-cyan-600",
		helpTitle: "Como calculamos o previsto",
		helpLines: [
			"Acumulamos o balanço mês a mês até o período atual.",
			"Ele usa a mesma regra do card de balanço em cada mês do histórico.",
			"Receitas e despesas de contas marcadas como não consideradas no saldo total ficam fora desse acumulado.",
			"Por isso também reflete ajustes de transferências entre contas consideradas e não consideradas.",
		],
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
	if (!Number.isFinite(change)) return "—";
	if (change > 999) return "+999%";
	if (change < -999) return "-999%";
	return formatPercentage(change, {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		signDisplay: "always",
	});
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
				({
					label,
					subtitle,
					key,
					icon: Icon,
					invertTrend,
					iconClass,
					helpTitle,
					helpLines,
				}) => {
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
										<CardTitle className="flex items-center gap-1.5 ">
											<Icon className={cn("size-4", iconClass)} aria-hidden />
											{label}
											<MetricsCardInfoButton
												label={label}
												helpTitle={helpTitle}
												helpLines={helpLines}
											/>
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
										className="text-2xl leading-none font-medium"
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
