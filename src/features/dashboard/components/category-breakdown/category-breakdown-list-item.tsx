import Link from "next/link";
import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPercentage as formatPercentageValue } from "@/shared/utils/percentage";

type CategoryBreakdownListItemConfig = {
	shareLabel: string;
	percentageDigits: number;
	positiveTrend: "up" | "down";
	showBudget: boolean;
};

type CategoryBreakdownListItemProps = {
	category: DashboardCategoryBreakdownItem;
	periodParam: string;
	config: CategoryBreakdownListItemConfig;
	position: number;
};

const formatPercentage = (value: number, digits: number) =>
	formatPercentageValue(value, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
		absolute: true,
	});

export function CategoryBreakdownListItem({
	category,
	periodParam,
	config,
	position,
}: CategoryBreakdownListItemProps) {
	const hasBudget = config.showBudget && category.budgetAmount !== null;
	const budgetExceeded =
		hasBudget &&
		category.budgetUsedPercentage !== null &&
		category.budgetUsedPercentage > 100;
	const exceededAmount =
		budgetExceeded && category.budgetAmount
			? category.currentAmount - category.budgetAmount
			: 0;

	return (
		<div>
			<div className="flex items-center justify-between gap-2 transition-all duration-300 py-1.5">
				<span className="w-3 shrink-0 text-left text-xs font-medium text-muted-foreground">
					{position}
				</span>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<CategoryIconBadge
						icon={category.categoryIcon}
						name={category.categoryName}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<Link
								href={`/categories/${category.categoryId}?periodo=${periodParam}`}
								className="flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
							>
								<span className="truncate">{category.categoryName}</span>
							</Link>
						</div>
						<div className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
							<span>
								{formatPercentage(
									category.percentageOfTotal,
									config.percentageDigits,
								)}{" "}
								da {config.shareLabel}
							</span>
						</div>
						{hasBudget && category.budgetUsedPercentage !== null ? (
							<div
								className={`mt-0.5 text-xs ${budgetExceeded ? "text-destructive" : "text-info"}`}
							>
								{budgetExceeded ? (
									<>
										Limite excedido em{" "}
										<span className="font-medium">
											{formatCurrency(exceededAmount)}
										</span>
									</>
								) : (
									<>
										{formatPercentage(
											category.budgetUsedPercentage,
											config.percentageDigits,
										)}{" "}
										do limite utilizado
									</>
								)}
							</div>
						) : null}
					</div>
				</div>

				<div className="flex shrink-0 flex-col items-end gap-0.5">
					<MoneyValues
						className="text-foreground font-medium"
						amount={category.currentAmount}
					/>
					<PercentageChangeIndicator
						value={category.percentageChange}
						label={
							category.percentageChange !== null
								? formatPercentage(
										category.percentageChange,
										config.percentageDigits,
									)
								: undefined
						}
						positiveTrend={config.positiveTrend}
					/>
				</div>
			</div>
		</div>
	);
}
