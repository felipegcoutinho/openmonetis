import {
	RiArrowLeftRightLine,
	RiArrowRightDownLine,
	RiArrowRightLine,
	RiArrowRightUpLine,
	RiCalendar2Line,
} from "@remixicon/react";
import Link from "next/link";
import { MetricsCardInfoButton } from "@/features/dashboard/components/metrics-card-info-button";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import type { DashboardCardMetrics } from "@/features/dashboard/overview/dashboard-metrics-queries";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { formatPercentage } from "@/shared/utils/percentage";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";

type DashboardMetricsCardsProps = {
	metrics: DashboardCardMetrics;
	period: string;
	adminPayerSlug: string | null;
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
		transactionType: "receita",
		helpTitle: "Como calculamos receitas",
		helpLines: [
			"Somamos os lançamentos do tipo Receita no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados da pessoa principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"Reembolsos não entram como receita; eles abatem despesas e afetam o balanço líquido.",
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
		transactionType: "despesa",
		helpTitle: "Como calculamos despesas",
		helpLines: [
			"Somamos os lançamentos do tipo Despesa no período selecionado.",
			"Consideramos lançamentos efetivados e não efetivados da pessoa principal (admin).",
			"Movimentações de contas marcadas como não consideradas no saldo total ficam fora deste card.",
			"Não entram transferências internas nem lançamentos automáticos de fatura.",
			"Reembolsos do período reduzem o total de despesas, sem deixar o card negativo.",
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
		transactionType: null,
		helpTitle: "Como calculamos o balanço",
		helpLines: [
			"Partimos de receitas menos despesas do período.",
			"Reembolsos entram no resultado líquido, mas não inflam receitas nem despesas.",
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
		transactionType: null,
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

const getPercentChange = (current: number, previous: number): string | null => {
	const EPSILON = 0.01;

	if (Math.abs(previous) < EPSILON) {
		if (Math.abs(current) < EPSILON) return "0%";
		return null;
	}

	const change = ((current - previous) / Math.abs(previous)) * 100;
	if (!Number.isFinite(change)) return null;
	if (Math.abs(change) < TREND_THRESHOLD) return "0%";
	if (change > 999) return "+999%";
	if (change < -999) return "-999%";
	return formatPercentage(change, {
		maximumFractionDigits: 0,
		minimumFractionDigits: 0,
		signDisplay: "always",
	});
};

export function DashboardMetricsCards({
	metrics,
	period,
	adminPayerSlug,
}: DashboardMetricsCardsProps) {
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
					transactionType,
					helpTitle,
					helpLines,
				}) => {
					const metric = metrics[key];
					const trend = getTrend(metric.current, metric.previous);
					const percentChange = getPercentChange(
						metric.current,
						metric.previous,
					);
					const transactionsHref = transactionType
						? `/transactions?periodo=${formatPeriodForUrl(period)}&type=${transactionType}${adminPayerSlug ? `&payer=${adminPayerSlug}` : ""}`
						: null;

					return (
						<Card key={label} className="gap-2 overflow-hidden py-6">
							<CardHeader className="gap-1">
								<div className="flex items-center justify-between gap-2">
									<CardTitle className="flex items-center gap-1">
										<Icon className={cn("size-4", iconClass)} aria-hidden />
										{label}
										<MetricsCardInfoButton
											label={label}
											helpTitle={helpTitle}
											helpLines={helpLines}
										/>
									</CardTitle>
									{transactionsHref ? (
										<Link
											href={transactionsHref}
											className="rounded-sm px-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
											aria-label={`Ver lançamentos de ${label.toLowerCase()}`}
										>
											<RiArrowRightLine className="size-4" aria-hidden />
										</Link>
									) : null}
								</div>
								<CardDescription className="mt-1 tracking-tight">
									{subtitle}
								</CardDescription>
								<Separator className="mt-1" />
							</CardHeader>

							<CardContent className="flex flex-col">
								<div className="flex items-start justify-between mt-1">
									<div className="flex flex-col gap-2 min-w-0">
										<div className="flex flex-wrap items-center">
											<MoneyValues
												className="text-2xl leading-none"
												amount={metric.current}
											/>
										</div>

										<div className="text-xs text-muted-foreground gap-1 flex items-center">
											<span className="text-muted-foreground/50">vs</span>
											<MoneyValues
												className="inline text-xs"
												amount={metric.previous}
											/>
											<Badge
												variant="secondary"
												aria-hidden={!percentChange}
												className={cn(
													"w-14 justify-center px-0 text-xs",
													!percentChange && "invisible",
												)}
											>
												{percentChange ? (
													<PercentageChangeIndicator
														trend={trend}
														label={percentChange}
														positiveTrend={invertTrend ? "down" : "up"}
														showFlatIcon={false}
														className="shrink-0 justify-center text-center text-xs tabular-nums"
														iconClassName="hidden"
													/>
												) : (
													<span className="tabular-nums">0%</span>
												)}
											</Badge>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				},
			)}
		</div>
	);
}
