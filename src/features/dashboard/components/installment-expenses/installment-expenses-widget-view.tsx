import type { InstallmentExpensesData } from "@/features/dashboard/expenses/installment-expenses-queries";
import { InstallmentExpensesList } from "./installment-expenses-list";

type InstallmentExpensesWidgetViewProps = {
	data: InstallmentExpensesData;
};

export function InstallmentExpensesWidgetView({
	data,
}: InstallmentExpensesWidgetViewProps) {
	return (
		<div className="flex flex-col">
			<InstallmentExpensesList expenses={data.expenses} />
		</div>
	);
}
