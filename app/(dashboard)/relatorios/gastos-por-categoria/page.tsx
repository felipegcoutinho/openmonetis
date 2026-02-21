import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiPieChartLine,
} from "@remixicon/react";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { ExpensesByCategoryWidgetWithChart } from "@/components/dashboard/expenses-by-category-widget-with-chart";
import MoneyValues from "@/components/money-values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserId } from "@/lib/auth/server";
import { fetchExpensesByCategory } from "@/lib/dashboard/categories/expenses-by-category";
import { calculatePercentageChange } from "@/lib/utils/math";
import { parsePeriodParam } from "@/lib/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

const getSingleParam = (
	params: Record<string, string | string[] | undefined> | undefined,
	key: string,
) => {
	const value = params?.[key];
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function GastosPorCategoriaPage({
	searchParams,
}: PageProps) {
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");

	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const data = await fetchExpensesByCategory(userId, selectedPeriod);
	const percentageChange = calculatePercentageChange(
		data.currentTotal,
		data.previousTotal,
	);
	const hasIncrease = percentageChange !== null && percentageChange > 0;
	const hasDecrease = percentageChange !== null && percentageChange < 0;

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<RiPieChartLine className="size-4 text-primary" />
						Resumo do mês
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1">
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<div>
							<p className="text-xs text-muted-foreground">
								Total de despesas no mês
							</p>
							<MoneyValues
								amount={data.currentTotal}
								className="text-2xl font-semibold"
							/>
						</div>
						{percentageChange !== null && (
							<span
								className={`flex items-center gap-0.5 text-sm ${
									hasIncrease
										? "text-destructive"
										: hasDecrease
											? "text-success"
											: "text-muted-foreground"
								}`}
							>
								{hasIncrease && <RiArrowUpSFill className="size-4" />}
								{hasDecrease && <RiArrowDownSFill className="size-4" />}
								{percentageChange > 0 ? "+" : ""}
								{percentageChange.toFixed(1)}% em relação ao mês anterior
							</span>
						)}
					</div>
					<p className="text-xs text-muted-foreground">
						Mês anterior: <MoneyValues amount={data.previousTotal} />
					</p>
				</CardContent>
			</Card>

			<Card className="p-4 md:p-6">
				<ExpensesByCategoryWidgetWithChart
					data={data}
					period={selectedPeriod}
				/>
			</Card>
		</main>
	);
}
