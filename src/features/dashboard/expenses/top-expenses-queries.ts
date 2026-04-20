export type TopExpense = {
	id: string;
	name: string;
	amount: number;
	purchaseDate: Date;
	paymentMethod: string;
	logo?: string | null;
};

export type TopExpensesData = {
	expenses: TopExpense[];
};
