import { BudgetDialog } from "@/components/orcamentos/budget-dialog";
import type { Budget, BudgetCategory } from "@/components/orcamentos/types";

type GoalsProgressWidgetDialogsProps = {
	selectedBudget: Budget | null;
	editOpen: boolean;
	categories: BudgetCategory[];
	defaultPeriod: string;
	onEditOpenChange: (open: boolean) => void;
};

export function GoalsProgressWidgetDialogs({
	selectedBudget,
	editOpen,
	categories,
	defaultPeriod,
	onEditOpenChange,
}: GoalsProgressWidgetDialogsProps) {
	return (
		<BudgetDialog
			mode="update"
			budget={selectedBudget ?? undefined}
			categories={categories}
			defaultPeriod={defaultPeriod}
			open={editOpen && !!selectedBudget}
			onOpenChange={onEditOpenChange}
		/>
	);
}
