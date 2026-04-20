"use client";

import {
	type BillDialogState,
	getCurrentBillDateString,
	markBillAsSettled,
} from "@/features/dashboard/bills/bills-helpers";
import type { DashboardBill } from "@/features/dashboard/bills/bills-queries";
import {
	type PaymentDialogController,
	usePaymentDialogController,
} from "@/features/dashboard/payments/use-payment-dialog-controller";
import { toggleTransactionSettlementAction } from "@/features/transactions/actions";

const EMPTY_BILLS: DashboardBill[] = [];

type BillWidgetController = Omit<
	PaymentDialogController<DashboardBill>,
	"selectedItem"
> & {
	selectedBill: DashboardBill | null;
	modalState: BillDialogState;
};

export function useBillWidgetController(
	bills?: DashboardBill[],
): BillWidgetController {
	const safeBills = bills ?? EMPTY_BILLS;
	const controller = usePaymentDialogController({
		items: safeBills,
		getItemId: (bill) => bill.id,
		isItemConfirmed: (bill) => bill.isSettled,
		executeConfirm: (bill) =>
			toggleTransactionSettlementAction({
				id: bill.id,
				value: true,
			}),
		applyConfirmedState: (bill) =>
			markBillAsSettled(bill, getCurrentBillDateString()),
	});

	return {
		...controller,
		selectedBill: controller.selectedItem,
	};
}
