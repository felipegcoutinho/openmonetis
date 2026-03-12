"use client";

import { useMemo, useState } from "react";
import type {
	Budget,
	BudgetCategory,
} from "@/features/budgets/components/types";
import {
	mapGoalProgressCategoriesToBudgetCategories,
	mapGoalProgressItemToBudget,
} from "@/features/dashboard/goals-progress-helpers";
import type {
	GoalProgressItem,
	GoalsProgressData,
} from "@/features/dashboard/goals-progress-queries";

export type GoalsProgressWidgetController = {
	selectedBudget: Budget | null;
	editOpen: boolean;
	categories: BudgetCategory[];
	defaultPeriod: string;
	handleEdit: (item: GoalProgressItem) => void;
	handleEditOpenChange: (open: boolean) => void;
};

export function useGoalsProgressWidgetController(
	data: GoalsProgressData,
): GoalsProgressWidgetController {
	const [editOpen, setEditOpen] = useState(false);
	const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

	const categories = useMemo<BudgetCategory[]>(
		() => mapGoalProgressCategoriesToBudgetCategories(data.categories),
		[data.categories],
	);

	const defaultPeriod = data.items[0]?.period ?? "";

	const handleEdit = (item: GoalProgressItem) => {
		setSelectedBudget(mapGoalProgressItemToBudget(item));
		setEditOpen(true);
	};

	const handleEditOpenChange = (open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedBudget(null);
		}
	};

	return {
		selectedBudget,
		editOpen,
		categories,
		defaultPeriod,
		handleEdit,
		handleEditOpenChange,
	};
}
