import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import type { CategoryType } from "@/lib/categorias/constants";
import { currencyFormatter } from "@/lib/lancamentos/formatting-helpers";
import { cn } from "@/lib/utils/ui";
import { CategoryIconBadge } from "./category-icon-badge";
import { TypeBadge } from "../type-badge";
import { Card } from "../ui/card";

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
				? "text-emerald-600"
				: isDecrease
					? "text-rose-600"
					: "text-muted-foreground"
			: isIncrease
				? "text-rose-600"
				: isDecrease
					? "text-emerald-600"
					: "text-muted-foreground";

	const variationIcon =
		isIncrease || isDecrease ? (
			isIncrease ? (
				<RiArrowUpLine className="size-4" aria-hidden />
			) : (
				<RiArrowDownLine className="size-4" aria-hidden />
			)
		) : null;

	const variationLabel =
		typeof percentageChange === "number"
			? `${percentageChange > 0 ? "+" : ""}${Math.abs(percentageChange).toFixed(
					1,
				)}%`
			: "—";

	return (
		<Card className="px-4">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-3">
					<CategoryIconBadge
						icon={category.icon}
						name={category.name}
						colorIndex={0}
						size="lg"
					/>
					<div className="space-y-2">
						<h1 className="text-xl font-semibold leading-tight">
							{category.name}
						</h1>
						<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							<TypeBadge type={category.type} />
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
