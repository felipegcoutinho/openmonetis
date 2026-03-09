"use client";

import { toggleLancamentoSettlementAction } from "@/app/(dashboard)/lancamentos/actions";
import type { DashboardBill } from "@/lib/dashboard/bills";
import {
	type BillDialogState,
	getCurrentBillDateString,
	markBillAsSettled,
} from "@/lib/dashboard/bills-helpers";
import {
	type PaymentDialogController,
	usePaymentDialogController,
} from "@/lib/dashboard/use-payment-dialog-controller";

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
