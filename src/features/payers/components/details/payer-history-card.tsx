"use client";

import { RiBarChartLine } from "@remixicon/react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	type LabelProps,
	XAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/shared/components/ui/chart";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import type { PayerHistoryPoint } from "@/shared/lib/payers/details";
import { currencyFormatter } from "@/shared/utils/currency";

const chartConfig = {
	despesas: {
		label: "Despesas",
		color: "hsl(356, 72%, 50%)",
	},
};

type PagadorHistoryCardProps = {
	data: PayerHistoryPoint[];
};

const ValueLabel = (props: LabelProps) => {
	const { x, y, value, width } = props;
	if (typeof x !== "number" || typeof y !== "number" || width === undefined) {
		return null;
	}
	const labelX = x + (Number(width) ?? 0) / 2;
	const amount =
		typeof value === "number" ? currencyFormatter.format(value) : value;
	const labelY = Math.max(y - 6, 12);
	return (
		<text
			x={labelX}
			y={labelY}
			fill="currentColor"
			textAnchor="middle"
			className="text-xs font-medium text-muted-foreground"
		>
			{amount}
		</text>
	);
};

export function PayerHistoryCard({ data }: PagadorHistoryCardProps) {
	const hasData = data.length > 0;

	return (
		<Card className="border">
			<CardHeader className="gap-1.5 pb-3">
				<CardTitle className="text-lg font-semibold">
					Evolução (últimos 6 meses)
				</CardTitle>
				<p className="text-xs text-muted-foreground">
					Despesas registradas para este pagador ao longo do tempo.
				</p>
			</CardHeader>

			<CardContent className="pt-0">
				{hasData ? (
					<ChartContainer
						config={chartConfig}
						className="mx-auto flex h-[210px] w-full max-w-[520px] items-center justify-center aspect-auto"
					>
						<BarChart
							data={data}
							barCategoryGap={16}
							margin={{ top: 28, right: 8, left: 8, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar
								dataKey="despesas"
								fill="var(--color-despesas)"
								radius={[6, 6, 0, 0]}
							>
								<LabelList dataKey="despesas" content={<ValueLabel />} />
							</Bar>
						</BarChart>
					</ChartContainer>
				) : (
					<WidgetEmptyState
						icon={<RiBarChartLine className="size-6 text-muted-foreground" />}
						title="Sem dados para exibir"
						description="Ainda não há movimentações suficientes para gerar este gráfico."
					/>
				)}
			</CardContent>
		</Card>
	);
}
