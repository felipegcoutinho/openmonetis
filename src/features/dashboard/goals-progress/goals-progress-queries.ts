export type GoalProgressStatus = "on-track" | "critical" | "exceeded";

export type GoalProgressItem = {
	id: string;
	categoryId: string | null;
	categoryName: string;
	categoryIcon: string | null;
	period: string;
	createdAt: string;
	budgetAmount: number;
	spentAmount: number;
	usedPercentage: number;
	status: GoalProgressStatus;
};

export type GoalProgressCategory = {
	id: string;
	name: string;
	icon: string | null;
};

export type GoalsProgressData = {
	items: GoalProgressItem[];
	categories: GoalProgressCategory[];
	totalBudgets: number;
	exceededCount: number;
	criticalCount: number;
};
