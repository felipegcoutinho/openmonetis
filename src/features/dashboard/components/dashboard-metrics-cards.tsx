import {
	RiArrowLeftRightLine,
	RiArrowRightDownLine,
	RiArrowRightUpLine,
	RiCalendar2Line,
} from "@remixicon/react";
import { MetricsCardInfoButton } from "@/features/dashboard/components/metrics-card-info-button";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import type { DashboardCardMetrics } from "@/features/dashboard/overview/dashboard-metrics-queries";
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
		icon: RiArrowRightDownLine,
		invertTrend: false,
		iconClass: "text-success",
		helpTitle: "Como calculamos receitas",
		helpLines: [
			"Somamos os lançamentos do tipo Receita no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados da pessoa principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"Saldo inicial também fica fora quando a conta está marcada para desconsiderá-lo das receitas.",
		],
	},
	{
		label: "Despesas",
		subtitle: "Saídas do período",
		key: "despesas",
		icon: RiArrowRightUpLine,
		invertTrend: true,
		iconClass: "text-destructive",
		helpTitle: "Como calculamos despesas",
		helpLines: [
			"Somamos os lançamentos do tipo Despesa no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados da pessoa principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"O valor mostrado é a saída efetiva do período, sempre em número positivo no card.",
		],
	},
	{
		label: "Balanço",
		subtitle: "Receitas, despesas e ajustes entre contas",
		key: "balanco",
		icon: RiArrowLeftRightLine,
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
		icon: RiCalendar2Line,
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
					const percentChange = getPercentChange(
						metric.current,
						metric.previous,
					);

					return (
						<Card key={label} className="gap-2 overflow-hidden">
							<CardHeader className="gap-1">
								<CardTitle className="flex items-center gap-1">
									<Icon className={cn("size-4", iconClass)} aria-hidden />
									{label}
									<MetricsCardInfoButton
										label={label}
										helpTitle={helpTitle}
										helpLines={helpLines}
									/>
								</CardTitle>
								<CardDescription className="mt-1 tracking-tight">
									{subtitle}
								</CardDescription>
								<Separator className="mt-1" />
							</CardHeader>

							<CardContent className="flex flex-col gap-3">
								<div className="flex flex-wrap items-center justify-between gap-2 mt-1">
									<MoneyValues
										className="text-2xl leading-none font-medium"
										amount={metric.current}
									/>
									<PercentageChangeIndicator
										trend={trend}
										label={percentChange}
										positiveTrend={invertTrend ? "down" : "up"}
										showFlatIcon
										className="gap-1"
										iconClassName="size-3.5"
									/>
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
