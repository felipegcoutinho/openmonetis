"use client";

import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiLineChartLine,
} from "@remixicon/react";
import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { cn } from "@/shared/utils/ui";

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
				const isUp = change > 0;

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
							<span
								className={cn(
									"inline-flex shrink-0 items-center gap-0.5 font-semibold text-sm",
									isUp ? " text-destructive" : " text-success",
								)}
							>
								{isUp ? (
									<RiArrowUpSFill className="size-3.5" />
								) : (
									<RiArrowDownSFill className="size-3.5" />
								)}
								{Math.abs(change).toFixed(0)}%
							</span>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
