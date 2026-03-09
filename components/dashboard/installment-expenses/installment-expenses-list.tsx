import { RiNumbersLine } from "@remixicon/react";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import type { InstallmentExpense } from "@/lib/dashboard/expenses/installment-expenses";
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
				title="Nenhuma despesa parcelada"
				description="Lançamentos parcelados aparecerão aqui conforme forem registrados."
			/>
		);
	}

	return (
		<ul className="flex flex-col gap-2">
			{expenses.map((expense) => (
				<InstallmentExpenseListItem key={expense.id} expense={expense} />
			))}
		</ul>
	);
}
