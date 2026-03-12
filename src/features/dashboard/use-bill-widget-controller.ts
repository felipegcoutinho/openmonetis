"use client";

import {
	type BillDialogState,
	getCurrentBillDateString,
	markBillAsSettled,
} from "@/features/dashboard/bills-helpers";
import type { DashboardBill } from "@/features/dashboard/bills-queries";
import {
	type PaymentDialogController,
	usePaymentDialogController,
} from "@/features/dashboard/use-payment-dialog-controller";
import { toggleLancamentoSettlementAction } from "@/features/transactions/actions";

const EMPTY_BILLS: DashboardBill[] = [];

export type BillWidgetController = Omit<
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
			toggleLancamentoSettlementAction({
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
