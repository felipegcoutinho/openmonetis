import { RiArrowDownSFill, RiArrowUpSFill } from "@remixicon/react";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import { Card } from "@/shared/components/ui/card";
import type { CategoryType } from "@/shared/lib/categories/constants";
import { currencyFormatter } from "@/shared/utils/currency";
import { formatPercentage } from "@/shared/utils/percentage";
import { cn } from "@/shared/utils/ui";
import { CategoryIconBadge } from "./category-icon-badge";

type CategorySummary = {
	id: string;
	name: string;
	icon: string | null;
	type: CategoryType;
};

type CategoryDetailHeaderProps = {
	category: CategorySummary;
	currentPeriodLabel: string;
	previousPeriodLabel: string;
	currentTotal: number;
	previousTotal: number;
	percentageChange: number | null;
	transactionCount: number;
};

export function CategoryDetailHeader({
	category,
	currentPeriodLabel,
	previousPeriodLabel,
	currentTotal,
	previousTotal,
	percentageChange,
	transactionCount,
}: CategoryDetailHeaderProps) {
	const isIncrease =
		typeof percentageChange === "number" && percentageChange > 0;
	const isDecrease =
		typeof percentageChange === "number" && percentageChange < 0;

	const variationColor =
		category.type === "receita"
			? isIncrease
				? "text-success"
				: isDecrease
					? "text-destructive"
					: "text-muted-foreground"
			: isIncrease
				? "text-destructive"
				: isDecrease
					? "text-success"
					: "text-muted-foreground";

	const variationIcon =
		isIncrease || isDecrease ? (
			isIncrease ? (
				<RiArrowUpSFill className="size-4" aria-hidden />
			) : (
				<RiArrowDownSFill className="size-4" aria-hidden />
			)
		) : null;

	const variationLabel =
		typeof percentageChange === "number"
			? formatPercentage(percentageChange, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
					absolute: true,
					signDisplay: percentageChange === 0 ? "auto" : "always",
				})
			: "—";

	return (
		<Card className="px-4">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-3">
					<CategoryIconBadge
						icon={category.icon}
						name={category.name}
						size="lg"
					/>
					<div className="space-y-2">
						<h1 className="text-xl font-semibold leading-tight">
							{category.name}
						</h1>
						<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							<TransactionTypeBadge kind={category.type} />
							<span>
								{transactionCount}{" "}
								{transactionCount === 1 ? "lançamento" : "lançamentos"} no{" "}
								período
							</span>
						</div>
					</div>
				</div>

				<div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Total em {currentPeriodLabel}
						</p>
						<p className="mt-1 text-2xl font-semibold">
							{currencyFormatter.format(currentTotal)}
						</p>
					</div>
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Total em {previousPeriodLabel}
						</p>
						<p className="mt-1 text-lg font-medium text-muted-foreground">
							{currencyFormatter.format(previousTotal)}
						</p>
					</div>
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Variação vs mês anterior
						</p>
						<div
							className={cn(
								"mt-1 flex items-center gap-1 text-xl font-semibold",
								variationColor,
							)}
						>
							{variationIcon}
							<span>{variationLabel}</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
