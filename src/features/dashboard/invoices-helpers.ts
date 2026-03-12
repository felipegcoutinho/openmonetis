import type { DashboardInvoice } from "@/features/dashboard/invoices-queries";
import type { PaymentDialogState } from "@/features/dashboard/use-payment-dialog-controller";
import {
	INVOICE_PAYMENT_STATUS,
	type InvoicePaymentStatus,
} from "@/shared/lib/invoices";
import { getBusinessDateString } from "@/shared/utils/date";
import {
	buildDueDateInfoFromPeriodDay,
	formatFinancialDateLabel,
} from "@/shared/utils/financial-dates";
import { formatPercentage } from "@/shared/utils/percentage";
import { formatPeriodForUrl } from "@/shared/utils/period";

export type InvoiceDialogState = PaymentDialogState;
export type InvoiceLogoTone = "muted" | "accent";

type InvoicePaymentDateInfo = {
	label: string;
};

type InvoiceDueDateInfo = {
	label: string;
	date: string | null;
};

export const buildInvoiceInitials = (value: string) => {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "CC";
	}
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CC";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "CC";
};

export const parseInvoiceDueDate = (
	period: string,
	dueDay: string,
): InvoiceDueDateInfo => {
	return buildDueDateInfoFromPeriodDay(period, dueDay);
};

export const formatInvoicePaymentDate = (
	value: string | null,
): InvoicePaymentDateInfo | null => {
	const label = formatFinancialDateLabel(value, "Pago em");
	if (!label) {
		return null;
	}

	return {
		label,
	};
};

export const getCurrentDateString = () => getBusinessDateString();

const formatInvoiceSharePercentage = (value: number) => {
	if (!Number.isFinite(value) || value <= 0) {
		return "0%";
	}
	const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
	return formatPercentage(value, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
};

export const getInvoiceShareLabel = (amount: number, total: number) => {
	if (total <= 0) {
		return "0% do total";
	}
	const percentage = (amount / total) * 100;
	return `${formatInvoiceSharePercentage(percentage)} do total`;
};

export const getInvoiceStatusBadgeVariant = (
	statusLabel: string,
): "success" | "info" => {
	if (statusLabel.toLowerCase() === "em aberto") {
		return "info";
	}
	return "success";
};

export const buildInvoiceDetailsHref = (cardId: string, period: string) =>
	`/cards/${cardId}/invoice?periodo=${formatPeriodForUrl(period)}`;

export const markInvoiceAsPaid = (
	invoice: DashboardInvoice,
	paidAt: string,
): DashboardInvoice => ({
	...invoice,
	paymentStatus: INVOICE_PAYMENT_STATUS.PAID,
	paidAt,
});

export const isInvoicePaid = (status: InvoicePaymentStatus) =>
	status === INVOICE_PAYMENT_STATUS.PAID;
