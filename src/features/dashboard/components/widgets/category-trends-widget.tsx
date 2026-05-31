"use client";

import {
	RiArrowRightLine,
	RiCalendarLine,
	RiHistoryLine,
	RiLineChartLine,
} from "@remixicon/react";
import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { formatPercentage } from "@/shared/utils/percentage";

type CategoryTrendsWidgetProps = {
	categories: DashboardCategoryBreakdownItem[];
};

export function CategoryTrendsWidget({
	categories,
}: CategoryTrendsWidgetProps) {
	const trending = categories
		.filter((c) => c.percentageChange !== null && c.previousAmount > 0)
		.sort(
			(a, b) =>
				Math.abs(b.percentageChange ?? 0) - Math.abs(a.percentageChange ?? 0),
		)
		.slice(0, 10);

	if (trending.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiLineChartLine className="size-6 text-muted-foreground" />}
				title="Dados insuficientes"
				description="As variações aparecem após lançamentos em dois meses consecutivos."
			/>
		);
	}

	return (
		<ul className="flex flex-col space-y-1">
			{trending.map((category) => {
				const change = category.percentageChange ?? 0;

				return (
					<li key={category.categoryId}>
						<div className="-mx-2 flex items-center gap-3 rounded-md p-2">
							<CategoryIconBadge
								icon={category.categoryIcon}
								name={category.categoryName}
								size="md"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-foreground">
									{category.categoryName}
								</p>
								<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span
										className="inline-flex items-center gap-1"
										title="Mês anterior"
									>
										<RiHistoryLine className="size-3.5" aria-hidden />
										<span className="sr-only">Mês anterior:</span>
										<MoneyValues amount={category.previousAmount} />
									</span>
									<RiArrowRightLine className="size-3" aria-hidden />
									<span
										className="inline-flex items-center gap-1 text-foreground"
										title="Mês atual"
									>
										<RiCalendarLine
											className="size-3.5 text-primary"
											aria-hidden
										/>
										<span className="sr-only">Mês atual:</span>
										<MoneyValues
											amount={category.currentAmount}
											className="font-semibold"
										/>
									</span>
								</p>
							</div>
							<PercentageChangeIndicator
								value={change}
								label={formatPercentage(change, {
									absolute: true,
									minimumFractionDigits: 0,
									maximumFractionDigits: 0,
								})}
								positiveTrend="down"
								className="shrink-0 text-sm font-semibold"
								iconClassName="size-3.5"
							/>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
