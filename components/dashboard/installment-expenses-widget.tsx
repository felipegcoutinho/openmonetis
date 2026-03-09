import type { InstallmentExpensesData } from "@/lib/dashboard/expenses/installment-expenses";
import { InstallmentExpensesWidgetView } from "./installment-expenses/installment-expenses-widget-view";

type InstallmentExpensesWidgetProps = {
	data: InstallmentExpensesData;
};

export function InstallmentExpensesWidget({
	data,
}: InstallmentExpensesWidgetProps) {
	return <InstallmentExpensesWidgetView data={data} />;
}
