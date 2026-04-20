export type CategoryOption = {
	id: string;
	name: string;
	type: string;
};

export type CategoryTransaction = {
	id: string;
	name: string;
	amount: number;
	purchaseDate: Date;
	logo: string | null;
};

export type PurchasesByCategoryData = {
	categories: CategoryOption[];
	transactionsByCategory: Record<string, CategoryTransaction[]>;
};
