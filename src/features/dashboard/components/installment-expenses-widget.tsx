import type { InstallmentExpensesData } from "@/features/dashboard/expenses/installment-expenses-queries";
import { InstallmentExpensesWidgetView } from "./installment-expenses/installment-expenses-widget-view";

type InstallmentExpensesWidgetProps = {
	data: InstallmentExpensesData;
};

export function InstallmentExpensesWidget({
	data,
}: InstallmentExpensesWidgetProps) {
	return <InstallmentExpensesWidgetView data={data} />;
}
