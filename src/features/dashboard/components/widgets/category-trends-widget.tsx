"use client";

import { RiLineChartLine } from "@remixicon/react";
import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
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
								<p className="text-xs text-muted-foreground">
									<MoneyValues amount={category.previousAmount} /> vs{" "}
									<MoneyValues
										amount={category.currentAmount}
										className="font-semibold"
									/>
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
