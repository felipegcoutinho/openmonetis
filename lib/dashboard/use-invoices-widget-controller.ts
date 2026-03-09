"use client";

import { updateInvoicePaymentStatusAction } from "@/app/(dashboard)/cartoes/[cartaoId]/fatura/actions";
import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import {
	getCurrentDateString,
	type InvoiceDialogState,
	isInvoicePaid,
	markInvoiceAsPaid,
} from "@/lib/dashboard/invoices-helpers";
import {
	type PaymentDialogController,
	usePaymentDialogController,
} from "@/lib/dashboard/use-payment-dialog-controller";
import { INVOICE_PAYMENT_STATUS } from "@/lib/faturas";

export type InvoicesWidgetController = Omit<
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
				cartaoId: invoice.cardId,
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
