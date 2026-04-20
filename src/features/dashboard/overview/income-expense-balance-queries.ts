export type MonthData = {
	month: string;
	monthLabel: string;
	income: number;
	expense: number;
	balance: number;
};

export type IncomeExpenseBalanceData = {
	months: MonthData[];
};
