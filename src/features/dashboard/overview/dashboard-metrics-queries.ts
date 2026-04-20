type MetricPair = {
	current: number;
	previous: number;
};

export type DashboardCardMetrics = {
	period: string;
	previousPeriod: string;
	receitas: MetricPair;
	despesas: MetricPair;
	balanco: MetricPair;
	previsto: MetricPair;
};
