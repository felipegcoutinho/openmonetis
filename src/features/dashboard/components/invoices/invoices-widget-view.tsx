import type { InvoiceDialogState } from "@/features/dashboard/invoices/invoices-helpers";
import type {
	DashboardInvoice,
	InvoicePaymentAccountOption,
} from "@/features/dashboard/invoices/invoices-queries";
import { InvoicePaymentDialog } from "./invoice-payment-dialog";
import { InvoicesList } from "./invoices-list";

type InvoicesWidgetViewProps = {
	invoices: DashboardInvoice[];
	selectedInvoice: DashboardInvoice | null;
	isModalOpen: boolean;
	modalState: InvoiceDialogState;
	isPending: boolean;
	paymentAccountId: string;
	onPaymentAccountChange: (accountId: string) => void;
	paymentDate: Date;
	onPaymentDateChange: (date: Date) => void;
	paymentAccountOptions: InvoicePaymentAccountOption[];
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
	paymentAccountId,
	onPaymentAccountChange,
	paymentDate,
	onPaymentDateChange,
	paymentAccountOptions,
	onOpenPaymentDialog,
	onClosePaymentDialog,
	onConfirmPayment,
}: InvoicesWidgetViewProps) {
	return (
		<>
			<InvoicesList invoices={invoices} onPay={onOpenPaymentDialog} />

			<InvoicePaymentDialog
				invoice={selectedInvoice}
				open={isModalOpen}
				modalState={modalState}
				isPending={isPending}
				paymentAccountId={paymentAccountId}
				onPaymentAccountChange={onPaymentAccountChange}
				paymentDate={paymentDate}
				onPaymentDateChange={onPaymentDateChange}
				paymentAccountOptions={paymentAccountOptions}
				onClose={onClosePaymentDialog}
				onConfirm={onConfirmPayment}
			/>
		</>
	);
}
