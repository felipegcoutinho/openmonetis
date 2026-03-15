import { RiPencilLine } from "@remixicon/react";
import { CategoryIconBadge } from "@/features/categories/components/category-icon-badge";
import {
	clampGoalProgress,
	formatGoalProgressPercentage,
	getGoalProgressStatusColorClass,
} from "@/features/dashboard/goals-progress-helpers";
import type { GoalProgressItem as GoalProgressItemData } from "@/features/dashboard/goals-progress-queries";
import MoneyValues from "@/shared/components/money-values";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";

type GoalProgressItemProps = {
	item: GoalProgressItemData;
	index: number;
	onEdit: (item: GoalProgressItemData) => void;
};

export function GoalProgressItem({
	item,
	index,
	onEdit,
}: GoalProgressItemProps) {
	const statusColor = getGoalProgressStatusColorClass(item.status);
	const progressValue = clampGoalProgress(item.usedPercentage, 0, 100);
	const percentageDelta = item.usedPercentage - 100;

	return (
		<div className="transition-all duration-300 py-2">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-2">
					<CategoryIconBadge
						icon={item.categoryIcon}
						name={item.categoryName}
						colorIndex={index}
						size="md"
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-foreground">
							{item.categoryName}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							<MoneyValues amount={item.spentAmount} /> de{" "}
							<MoneyValues amount={item.budgetAmount} />
						</p>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<span className={`text-xs font-medium ${statusColor}`}>
						{formatGoalProgressPercentage(percentageDelta, true)}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => onEdit(item)}
						aria-label={`Editar orçamento de ${item.categoryName}`}
					>
						<RiPencilLine className="size-3.5" />
					</Button>
				</div>
			</div>
			<div className="ml-11 mt-1.5">
				<Progress value={progressValue} />
			</div>
		</div>
	);
}
