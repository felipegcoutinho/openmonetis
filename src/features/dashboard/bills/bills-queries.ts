export type DashboardBill = {
	id: string;
	name: string;
	amount: number;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	isSettled: boolean;
};

export type DashboardBillsSnapshot = {
	bills: DashboardBill[];
	totalPendingAmount: number;
	pendingCount: number;
};
