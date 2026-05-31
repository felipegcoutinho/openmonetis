import type { DashboardBill } from "@/features/dashboard/bills/bills-queries";
import type { PaymentDialogState } from "@/features/dashboard/payments/use-payment-dialog-controller";
import {
	getBusinessDateString,
	isDateOnlyPast,
	parseUtcDateString,
	toDateOnlyString,
} from "@/shared/utils/date";
import {
	buildFinancialStatusLabel,
	buildRelativeFinancialStatusLabel,
	formatFinancialDateLabel,
	formatRelativeFinancialDateLabel,
} from "@/shared/utils/financial-dates";

export type BillDialogState = PaymentDialogState;
type BillStatusDateItem = Pick<
	DashboardBill,
	"dueDate" | "boletoPaymentDate" | "isSettled" | "transactionType"
>;

export const isIncomeBill = (bill: Pick<DashboardBill, "transactionType">) => {
	return bill.transactionType === "Receita";
};

export const formatBillDateLabel = (value: string | null, prefix?: string) => {
	return formatFinancialDateLabel(value, prefix);
};

export const buildBillStatusLabel = (bill: BillStatusDateItem) => {
	return buildFinancialStatusLabel({
		isSettled: bill.isSettled,
		dueDate: bill.dueDate,
		paidAt: bill.boletoPaymentDate,
		paidPrefix: isIncomeBill(bill) ? "Recebido em" : "Pago em",
	});
};

export const buildBillWidgetStatusLabel = (bill: BillStatusDateItem) => {
	if (bill.isSettled && isIncomeBill(bill)) {
		return formatRelativeFinancialDateLabel(bill.boletoPaymentDate, "received");
	}

	return buildRelativeFinancialStatusLabel({
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

export const formatBillWidgetOverdueLabel = (
	bill: Pick<DashboardBill, "dueDate" | "isSettled" | "transactionType">,
): string | null => {
	if (bill.isSettled) {
		return null;
	}

	const dueDateValue = toDateOnlyString(bill.dueDate);
	const todayValue = getBusinessDateString();
	if (!dueDateValue || dueDateValue >= todayValue) {
		return null;
	}

	const dueDate = parseUtcDateString(dueDateValue);
	const today = parseUtcDateString(todayValue);
	if (!dueDate || !today) {
		return null;
	}

	const overdueDays = Math.round(
		(today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000),
	);
	const overdueLabel = isIncomeBill(bill) ? "Atrasada" : "Atrasado";
	return overdueDays === 1
		? `${overdueLabel} · venceu ontem`
		: `${overdueLabel} · venceu há ${overdueDays} dias`;
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
