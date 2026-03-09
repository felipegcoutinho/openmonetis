import type { Budget, BudgetCategory } from "@/components/orcamentos/types";
import type {
	GoalProgressItem,
	GoalsProgressData,
} from "@/lib/dashboard/goals-progress";
import { GoalsProgressList } from "./goals-progress-list";
import { GoalsProgressWidgetDialogs } from "./goals-progress-widget-dialogs";

type GoalsProgressWidgetViewProps = {
	data: GoalsProgressData;
	selectedBudget: Budget | null;
	editOpen: boolean;
	categories: BudgetCategory[];
	defaultPeriod: string;
	onEdit: (item: GoalProgressItem) => void;
	onEditOpenChange: (open: boolean) => void;
};

export function GoalsProgressWidgetView({
	data,
	selectedBudget,
	editOpen,
	categories,
	defaultPeriod,
	onEdit,
	onEditOpenChange,
}: GoalsProgressWidgetViewProps) {
	return (
		<div className="flex flex-col gap-4 px-0">
			<GoalsProgressList items={data.items} onEdit={onEdit} />

			<GoalsProgressWidgetDialogs
				selectedBudget={selectedBudget}
				editOpen={editOpen}
				categories={categories}
				defaultPeriod={defaultPeriod}
				onEditOpenChange={onEditOpenChange}
			/>
		</div>
	);
}
