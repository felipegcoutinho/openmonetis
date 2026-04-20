export type InstallmentExpense = {
	id: string;
	name: string;
	amount: number;
	paymentMethod: string;
	currentInstallment: number | null;
	installmentCount: number | null;
	dueDate: Date | null;
	purchaseDate: Date;
	period: string;
};

export type InstallmentExpensesData = {
	expenses: InstallmentExpense[];
};
