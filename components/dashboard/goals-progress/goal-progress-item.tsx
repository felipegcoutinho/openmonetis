import { RiPencilLine } from "@remixicon/react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import MoneyValues from "@/components/shared/money-values";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GoalProgressItem as GoalProgressItemData } from "@/lib/dashboard/goals-progress";
import {
	clampGoalProgress,
	formatGoalProgressPercentage,
	getGoalProgressStatusColorClass,
} from "@/lib/dashboard/goals-progress-helpers";

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
		<li className="border-b border-dashed py-2 last:border-b-0 last:pb-0">
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
						variant="ghost"
						size="icon-sm"
						className="size-7 text-muted-foreground hover:text-foreground"
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
		</li>
	);
}
