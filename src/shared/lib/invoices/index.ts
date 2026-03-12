export const INVOICE_PAYMENT_STATUS = {
	PENDING: "pendente",
	PAID: "pago",
} as const;

export const INVOICE_STATUS_VALUES = Object.values(INVOICE_PAYMENT_STATUS);

export type InvoicePaymentStatus =
	(typeof INVOICE_PAYMENT_STATUS)[keyof typeof INVOICE_PAYMENT_STATUS];

export const INVOICE_STATUS_LABEL: Record<InvoicePaymentStatus, string> = {
	[INVOICE_PAYMENT_STATUS.PENDING]: "Em aberto",
	[INVOICE_PAYMENT_STATUS.PAID]: "Pago",
};

export const INVOICE_STATUS_BADGE_VARIANT: Record<
	InvoicePaymentStatus,
	"default" | "secondary" | "success" | "info"
> = {
	[INVOICE_PAYMENT_STATUS.PENDING]: "info",
	[INVOICE_PAYMENT_STATUS.PAID]: "success",
};

export const INVOICE_STATUS_DESCRIPTION: Record<InvoicePaymentStatus, string> =
	{
		[INVOICE_PAYMENT_STATUS.PENDING]:
			"Esta fatura ainda não foi quitada. Você pode realizar o pagamento assim que revisar os lançamentos.",
		[INVOICE_PAYMENT_STATUS.PAID]:
			"Esta fatura está quitada. Caso tenha sido um engano, é possível desfazer o pagamento.",
	};

export const PERIOD_FORMAT_REGEX = /^\d{4}-\d{2}$/;
