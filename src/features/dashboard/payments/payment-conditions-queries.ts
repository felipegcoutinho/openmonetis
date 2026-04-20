export type PaymentConditionSummary = {
	condition: string;
	amount: number;
	percentage: number;
	transactions: number;
};

export type PaymentConditionsData = {
	conditions: PaymentConditionSummary[];
};
