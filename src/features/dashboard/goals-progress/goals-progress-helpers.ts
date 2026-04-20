import type {
	Budget,
	BudgetCategory,
} from "@/features/budgets/components/types";
import type {
	GoalProgressCategory,
	GoalProgressItem,
	GoalProgressStatus,
} from "@/features/dashboard/goals-progress/goals-progress-queries";
import { formatPercentage } from "@/shared/utils/percentage";

export const clampGoalProgress = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export const formatGoalProgressPercentage = (value: number, withSign = false) =>
	formatPercentage(value, {
		maximumFractionDigits: 1,
		signDisplay: withSign ? "always" : "auto",
	});

export const getGoalProgressStatusColorClass = (status: GoalProgressStatus) =>
	status === "exceeded" ? "text-destructive" : "";

export const mapGoalProgressCategoriesToBudgetCategories = (
	categories: GoalProgressCategory[],
): BudgetCategory[] =>
	categories.map((category) => ({
		id: category.id,
		name: category.name,
		icon: category.icon,
	}));

export const mapGoalProgressItemToBudget = (
	item: GoalProgressItem,
): Budget => ({
	id: item.id,
	amount: item.budgetAmount,
	spent: item.spentAmount,
	period: item.period,
	createdAt: item.createdAt,
	category: item.categoryId
		? {
				id: item.categoryId,
				name: item.categoryName,
				icon: item.categoryIcon,
			}
		: null,
});
