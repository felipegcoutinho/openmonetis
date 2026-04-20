import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import { Card } from "@/shared/components/ui/card";
import type { CategoryType } from "@/shared/lib/categories/constants";
import { currencyFormatter } from "@/shared/utils/currency";
import { formatPercentage } from "@/shared/utils/percentage";

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
						<p className="mt-1 text-lg font-semibold text-muted-foreground">
							{currencyFormatter.format(previousTotal)}
						</p>
					</div>
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Variação vs mês anterior
						</p>
						<PercentageChangeIndicator
							value={percentageChange}
							label={variationLabel}
							positiveTrend={category.type === "receita" ? "up" : "down"}
							className="mt-1 gap-1 text-lg font-semibold"
							iconClassName="size-4"
						/>
					</div>
				</div>
			</div>
		</Card>
	);
}
