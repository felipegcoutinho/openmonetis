import { RiPencilLine } from "@remixicon/react";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import {
	clampGoalProgress,
	formatGoalProgressPercentage,
} from "@/features/dashboard/goals-progress/goals-progress-helpers";
import type { GoalProgressItem as GoalProgressItemData } from "@/features/dashboard/goals-progress/goals-progress-queries";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
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
	const progressValue = clampGoalProgress(item.usedPercentage, 0, 100);
	const percentageDelta = item.usedPercentage - 100;
	const isExceeded = item.status === "exceeded";

	return (
		<div className="group transition-all duration-300 py-2">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-2">
					<CategoryIconBadge
						icon={item.categoryIcon}
						name={item.categoryName}
						size="md"
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-foreground">
							{item.categoryName}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							<MoneyValues className="font-medium" amount={item.spentAmount} />{" "}
							de{" "}
							<MoneyValues className="font-medium" amount={item.budgetAmount} />
							<PercentageChangeIndicator
								value={percentageDelta}
								label={formatGoalProgressPercentage(percentageDelta, true)}
								positiveTrend="down"
								className="ml-1.5 align-middle"
							/>
						</p>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Button
						type="button"
						variant="link"
						size="icon-sm"
						className="transition-opacity text-primary hover:opacity-80"
						onClick={() => onEdit(item)}
						aria-label={`Atualizar orçamento de ${item.categoryName}`}
					>
						<RiPencilLine className="size-3.5" />
					</Button>
				</div>
			</div>
			<div className="ml-11 mt-1.5">
				<Progress
					value={progressValue}
					className={
						isExceeded
							? "**:data-[slot=progress-indicator]:bg-destructive bg-destructive/20"
							: undefined
					}
				/>
			</div>
		</div>
	);
}
