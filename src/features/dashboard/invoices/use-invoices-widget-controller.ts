"use client";

import {
	getCurrentDateString,
	type InvoiceDialogState,
	isInvoicePaid,
	markInvoiceAsPaid,
} from "@/features/dashboard/invoices/invoices-helpers";
import type { DashboardInvoice } from "@/features/dashboard/invoices/invoices-queries";
import {
	type PaymentDialogController,
	usePaymentDialogController,
} from "@/features/dashboard/payments/use-payment-dialog-controller";
import { updateInvoicePaymentStatusAction } from "@/features/invoices/actions";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";

type InvoicesWidgetController = Omit<
	PaymentDialogController<DashboardInvoice>,
	"selectedItem"
> & {
	selectedInvoice: DashboardInvoice | null;
	modalState: InvoiceDialogState;
};

export function useInvoicesWidgetController(
	invoices: DashboardInvoice[],
): InvoicesWidgetController {
	const controller = usePaymentDialogController({
		items: invoices,
		getItemId: (invoice) => invoice.id,
		isItemConfirmed: (invoice) => isInvoicePaid(invoice.paymentStatus),
		executeConfirm: (invoice) =>
			updateInvoicePaymentStatusAction({
				cardId: invoice.cardId,
				period: invoice.period,
				status: INVOICE_PAYMENT_STATUS.PAID,
			}),
		applyConfirmedState: (invoice) =>
			markInvoiceAsPaid(invoice, getCurrentDateString()),
	});

	return {
		...controller,
		selectedInvoice: controller.selectedItem,
	};
}
