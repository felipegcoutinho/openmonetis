export type RecurringExpense = {
	id: string;
	name: string;
	amount: number;
	paymentMethod: string;
	recurrenceCount: number | null;
};

export type RecurringExpensesData = {
	expenses: RecurringExpense[];
};
