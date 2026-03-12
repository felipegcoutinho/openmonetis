export type BudgetCategory = {
	id: string;
	name: string;
	icon: string | null;
};

export type Budget = {
	id: string;
	amount: number;
	spent: number;
	period: string;
	createdAt: string;
	category: BudgetCategory | null;
};

export type BudgetFormValues = {
	categoriaId: string;
	period: string;
	amount: string;
};
