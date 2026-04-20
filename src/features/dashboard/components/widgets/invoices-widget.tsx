"use client";

import type { DashboardInvoice } from "@/features/dashboard/invoices/invoices-queries";
import { useInvoicesWidgetController } from "@/features/dashboard/invoices/use-invoices-widget-controller";
import { InvoicesWidgetView } from "../invoices/invoices-widget-view";

type InvoicesWidgetProps = {
	invoices: DashboardInvoice[];
};

export function InvoicesWidget({ invoices }: InvoicesWidgetProps) {
	const {
		items,
		selectedInvoice,
		isModalOpen,
		modalState,
		isPending,
		openPaymentDialog,
		closePaymentDialog,
		confirmPayment,
	} = useInvoicesWidgetController(invoices);

	return (
		<InvoicesWidgetView
			invoices={items}
			selectedInvoice={selectedInvoice}
			isModalOpen={isModalOpen}
			modalState={modalState}
			isPending={isPending}
			onOpenPaymentDialog={openPaymentDialog}
			onClosePaymentDialog={closePaymentDialog}
			onConfirmPayment={confirmPayment}
		/>
	);
}
