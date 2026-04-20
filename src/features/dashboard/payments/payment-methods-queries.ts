export type PaymentMethodSummary = {
	paymentMethod: string;
	amount: number;
	percentage: number;
	transactions: number;
};

export type PaymentMethodsData = {
	methods: PaymentMethodSummary[];
};
