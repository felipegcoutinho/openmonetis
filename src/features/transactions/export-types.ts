export type TransactionExportFilters = {
	transactionFilter: string | null;
	conditionFilter: string | null;
	paymentFilter: string | null;
	payerFilter: string | null;
	categoryFilter: string | null;
	accountCardFilter: string | null;
	searchFilter: string | null;
	settledFilter: string | null;
	attachmentFilter: string | null;
	dividedFilter: string | null;
};

export type TransactionsExportContext = {
	source: "transactions" | "account-statement";
	period: string;
	filters: TransactionExportFilters;
	accountId?: string | null;
	cardId?: string | null;
	payerId?: string | null;
	settledOnly?: boolean;
};

export type TransactionsPaginationState = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};
