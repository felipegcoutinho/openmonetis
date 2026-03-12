import { formatPercentage } from "@/shared/utils/percentage";

export const formatPaymentBreakdownPercentage = (value: number) =>
	formatPercentage(value, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	});

export const formatPaymentBreakdownTransactionsLabel = (transactions: number) =>
	`${transactions} ${transactions === 1 ? "lançamento" : "lançamentos"}`;
