import { RiPencilLine } from "@remixicon/react";
import Link from "next/link";
import {
	clampGoalProgress,
	formatGoalProgressPercentage,
} from "@/features/dashboard/goals-progress/goals-progress-helpers";
import type { GoalProgressItem as GoalProgressItemData } from "@/features/dashboard/goals-progress/goals-progress-queries";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils";
import { formatPeriodForUrl } from "@/shared/utils/period";

type GoalProgressItemProps = {
	item: GoalProgressItemData;
	onEdit: (item: GoalProgressItemData) => void;
};

export function GoalProgressItem({ item, onEdit }: GoalProgressItemProps) {
	const progressValue = clampGoalProgress(item.usedPercentage, 0, 100);
	const isExceeded = item.status === "exceeded";
	const isCritical = item.status === "critical";
	const exceededAmount = Math.max(item.spentAmount - item.budgetAmount, 0);
	const usedPercentageLabel = formatGoalProgressPercentage(item.usedPercentage);

	return (
		<li className="group py-2 transition-all duration-300">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-2">
					<CategoryIconBadge
						icon={item.categoryIcon}
						name={item.categoryName}
						size="md"
					/>
					<div className="min-w-0 flex-1">
						{item.categoryId ? (
							<Link
								href={`/categories/${item.categoryId}?periodo=${formatPeriodForUrl(item.period)}`}
								className="block truncate text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
							>
								{item.categoryName}
							</Link>
						) : (
							<p className="truncate text-sm font-medium text-foreground">
								{item.categoryName}
							</p>
						)}
						<p className="mt-0.5 text-xs text-muted-foreground">
							<MoneyValues className="font-medium" amount={item.spentAmount} />{" "}
							de{" "}
							<MoneyValues className="font-medium" amount={item.budgetAmount} />
							<span aria-hidden> · </span>
							<span
								className={cn(
									"font-medium",
									isExceeded && "text-destructive",
									isCritical && "text-warning",
								)}
							>
								{isExceeded ? (
									<>
										<MoneyValues amount={exceededAmount} /> acima do limite
									</>
								) : (
									`${usedPercentageLabel} utilizado`
								)}
							</span>
						</p>
					</div>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="shrink-0 text-primary/70 opacity-70 transition-all hover:text-primary hover:opacity-100 focus-visible:text-primary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
							onClick={() => onEdit(item)}
							aria-label={`Atualizar orçamento de ${item.categoryName}`}
						>
							<RiPencilLine className="size-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">Atualizar orçamento</TooltipContent>
				</Tooltip>
			</div>
			<div className="ml-11 mt-1.5">
				<Progress
					value={progressValue}
					className={cn(
						isExceeded && "bg-destructive/20",
						isCritical && "bg-warning/20",
					)}
					indicatorClassName={cn(
						isExceeded && "bg-destructive",
						isCritical && "bg-warning",
					)}
					aria-label={`${usedPercentageLabel} do orçamento utilizado em ${item.categoryName}`}
				/>
			</div>
		</li>
	);
}
