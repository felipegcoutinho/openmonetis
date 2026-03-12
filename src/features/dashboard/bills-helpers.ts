import type { DashboardBill } from "@/features/dashboard/bills-queries";
import type { PaymentDialogState } from "@/features/dashboard/use-payment-dialog-controller";
import { getBusinessDateString, isDateOnlyPast } from "@/shared/utils/date";
import {
	buildFinancialStatusLabel,
	formatFinancialDateLabel,
} from "@/shared/utils/financial-dates";

export type BillDialogState = PaymentDialogState;
export type BillStatusDateItem = Pick<
	DashboardBill,
	"dueDate" | "boletoPaymentDate" | "isSettled"
>;

export const formatBillDateLabel = (value: string | null, prefix?: string) => {
	return formatFinancialDateLabel(value, prefix);
};

export const buildBillStatusLabel = (bill: BillStatusDateItem) => {
	return buildFinancialStatusLabel({
		isSettled: bill.isSettled,
		dueDate: bill.dueDate,
		paidAt: bill.boletoPaymentDate,
	});
};

export const getCurrentBillDateString = () => getBusinessDateString();

export const isBillOverdue = (bill: DashboardBill) => {
	if (bill.isSettled || !bill.dueDate) {
		return false;
	}

	return isDateOnlyPast(bill.dueDate);
};

export const getBillStatusBadgeVariant = (
	statusLabel: string,
): "success" | "info" => {
	if (statusLabel.toLowerCase() === "pendente") {
		return "info";
	}
	return "success";
};

export const markBillAsSettled = (
	bill: DashboardBill,
	boletoPaymentDate: string,
): DashboardBill => ({
	...bill,
	isSettled: true,
	boletoPaymentDate,
});
