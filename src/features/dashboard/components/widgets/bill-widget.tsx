"use client";

import type { DashboardBill } from "@/features/dashboard/bills/bills-queries";
import { useBillWidgetController } from "@/features/dashboard/bills/use-bill-widget-controller";
import { BillsWidgetView } from "../bills/bills-widget-view";

type BillWidgetProps = {
	bills?: DashboardBill[];
};

export function BillWidget({ bills }: BillWidgetProps) {
	const {
		items,
		selectedBill,
		isModalOpen,
		modalState,
		isPending,
		openPaymentDialog,
		closePaymentDialog,
		confirmPayment,
	} = useBillWidgetController(bills);

	return (
		<BillsWidgetView
			bills={items}
			selectedBill={selectedBill}
			isModalOpen={isModalOpen}
			modalState={modalState}
			isPending={isPending}
			onOpenPaymentDialog={openPaymentDialog}
			onClosePaymentDialog={closePaymentDialog}
			onConfirmPayment={confirmPayment}
		/>
	);
}
