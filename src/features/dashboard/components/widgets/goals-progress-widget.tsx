"use client";

import type { GoalsProgressData } from "@/features/dashboard/goals-progress/goals-progress-queries";
import { useGoalsProgressWidgetController } from "@/features/dashboard/goals-progress/use-goals-progress-widget-controller";
import { GoalsProgressWidgetView } from "../goals-progress/goals-progress-widget-view";

type GoalsProgressWidgetProps = {
	data: GoalsProgressData;
};

export function GoalsProgressWidget({ data }: GoalsProgressWidgetProps) {
	const {
		selectedBudget,
		editOpen,
		categories,
		defaultPeriod,
		handleEdit,
		handleEditOpenChange,
	} = useGoalsProgressWidgetController(data);

	return (
		<GoalsProgressWidgetView
			data={data}
			selectedBudget={selectedBudget}
			editOpen={editOpen}
			categories={categories}
			defaultPeriod={defaultPeriod}
			onEdit={handleEdit}
			onEditOpenChange={handleEditOpenChange}
		/>
	);
}
