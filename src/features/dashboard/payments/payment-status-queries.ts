export type PaymentStatusCategory = {
	total: number;
	confirmed: number;
	pending: number;
};

export type PaymentStatusData = {
	income: PaymentStatusCategory;
	expenses: PaymentStatusCategory;
};
