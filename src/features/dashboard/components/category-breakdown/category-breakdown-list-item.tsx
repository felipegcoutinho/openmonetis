import { RiExternalLinkLine, RiWallet3Line } from "@remixicon/react";
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
	includeBudgetAmount: boolean;
};

type CategoryBreakdownListItemProps = {
	category: DashboardCategoryBreakdownItem;
	periodParam: string;
	config: CategoryBreakdownListItemConfig;
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
}: CategoryBreakdownListItemProps) {
	const hasBudget = category.budgetAmount !== null;
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
			<div className="flex items-center justify-between gap-3 transition-all duration-300 py-2">
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<CategoryIconBadge
						icon={category.categoryIcon}
						name={category.categoryName}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<Link
								href={`/categories/${category.categoryId}?periodo=${periodParam}`}
								className="flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
							>
								<span className="truncate">{category.categoryName}</span>
								<RiExternalLinkLine
									className="size-3 shrink-0 text-muted-foreground"
									aria-hidden
								/>
							</Link>
						</div>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
							<span>
								{formatPercentage(
									category.percentageOfTotal,
									config.percentageDigits,
								)}{" "}
								da {config.shareLabel}
							</span>
							{hasBudget && category.budgetUsedPercentage !== null ? (
								<>
									<span aria-hidden>·</span>
									<span
										className={`flex items-center gap-1 ${budgetExceeded ? "text-destructive" : "text-info"}`}
									>
										<RiWallet3Line className="size-3 shrink-0" />
										{budgetExceeded ? (
											<>
												excedeu{" "}
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
												do limite
												{config.includeBudgetAmount &&
												category.budgetAmount !== null
													? ` ${formatCurrency(category.budgetAmount)}`
													: ""}
											</>
										)}
									</span>
								</>
							) : null}
						</div>
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
