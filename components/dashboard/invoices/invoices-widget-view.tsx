import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import type { InvoiceDialogState } from "@/lib/dashboard/invoices-helpers";
import { InvoicePaymentDialog } from "./invoice-payment-dialog";
import { InvoicesList } from "./invoices-list";

type InvoicesWidgetViewProps = {
	invoices: DashboardInvoice[];
	selectedInvoice: DashboardInvoice | null;
	isModalOpen: boolean;
	modalState: InvoiceDialogState;
	isPending: boolean;
	onOpenPaymentDialog: (invoiceId: string) => void;
	onClosePaymentDialog: () => void;
	onConfirmPayment: () => void;
};

export function InvoicesWidgetView({
	invoices,
	selectedInvoice,
	isModalOpen,
	modalState,
	isPending,
	onOpenPaymentDialog,
	onClosePaymentDialog,
	onConfirmPayment,
}: InvoicesWidgetViewProps) {
	return (
		<>
			<div className="flex flex-col gap-4">
				<InvoicesList invoices={invoices} onPay={onOpenPaymentDialog} />
			</div>

			<InvoicePaymentDialog
				invoice={selectedInvoice}
				open={isModalOpen}
				modalState={modalState}
				isPending={isPending}
				onClose={onClosePaymentDialog}
				onConfirm={onConfirmPayment}
			/>
		</>
	);
}
