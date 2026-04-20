export type PaymentOverviewTab = "conditions" | "methods";

export const DEFAULT_PAYMENT_OVERVIEW_TAB: PaymentOverviewTab = "conditions";

export const parsePaymentOverviewTab = (value: string): PaymentOverviewTab => {
	if (value === "methods") {
		return "methods";
	}

	return DEFAULT_PAYMENT_OVERVIEW_TAB;
};
