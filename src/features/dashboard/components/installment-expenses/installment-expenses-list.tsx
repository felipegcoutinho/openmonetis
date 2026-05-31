import { RiNumbersLine } from "@remixicon/react";
import type { InstallmentExpense } from "@/features/dashboard/expenses/installment-expenses-queries";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { InstallmentExpenseListItem } from "./installment-expense-list-item";

type InstallmentExpensesListProps = {
	expenses: InstallmentExpense[];
};

export function InstallmentExpensesList({
	expenses,
}: InstallmentExpensesListProps) {
	if (expenses.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiNumbersLine className="size-6 text-muted-foreground" />}
				title="Nenhuma despesa parcelada encontrada"
				description="Lançamentos parcelados aparecerão aqui conforme forem registrados."
			/>
		);
	}

	return (
		<div className="flex flex-col">
			{expenses.map((expense) => (
				<InstallmentExpenseListItem key={expense.id} expense={expense} />
			))}
		</div>
	);
}
