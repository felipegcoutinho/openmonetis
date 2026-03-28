import {
	and,
	count,
	desc,
	eq,
	gte,
	isNull,
	ne,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import {
	cards,
	categories,
	financialAccounts,
	payers,
	transactionAttachments,
	transactions,
} from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";

type BaseTransactionQueryInput = {
	filters: SQL[];
	extraFilters?: SQL[];
	excludeInitialBalanceFromIncome?: boolean;
};

type TransactionQueryInput = BaseTransactionQueryInput & {
	limit?: number;
	offset?: number;
};

export type PaginatedTransactionsResult = {
	rows: Awaited<ReturnType<typeof fetchTransactions>>;
	totalItems: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

const DEFAULT_EXCLUDE_INITIAL_BALANCE = true;

const buildInitialBalanceVisibilityFilter = () =>
	or(
		isNull(transactions.note),
		ne(transactions.note, INITIAL_BALANCE_NOTE),
		isNull(financialAccounts.excludeInitialBalanceFromIncome),
		eq(financialAccounts.excludeInitialBalanceFromIncome, false),
	);

const buildTransactionsWhere = ({
	filters,
	extraFilters = [],
	excludeInitialBalanceFromIncome = DEFAULT_EXCLUDE_INITIAL_BALANCE,
}: BaseTransactionQueryInput) => {
	const whereFilters = [...filters, ...extraFilters];

	if (excludeInitialBalanceFromIncome) {
		const initialBalanceFilter = buildInitialBalanceVisibilityFilter();

		if (initialBalanceFilter) {
			whereFilters.push(initialBalanceFilter);
		}
	}

	return and(...whereFilters);
};

const mapTransactionRows = (
	transactionRows: {
		transaction: typeof transactions.$inferSelect;
		payer: typeof payers.$inferSelect | null;
		financialAccount: typeof financialAccounts.$inferSelect | null;
		card: typeof cards.$inferSelect | null;
		category: typeof categories.$inferSelect | null;
		hasAttachments: boolean;
	}[],
) =>
	transactionRows.map((row) => ({
		...row.transaction,
		payer: row.payer,
		financialAccount: row.financialAccount,
		card: row.card,
		category: row.category,
		hasAttachments: row.hasAttachments,
	}));

async function selectTransactionsWithRelations({
	filters,
	extraFilters = [],
	excludeInitialBalanceFromIncome = DEFAULT_EXCLUDE_INITIAL_BALANCE,
	limit,
	offset,
}: TransactionQueryInput) {
	const baseQuery = db
		.select({
			transaction: transactions,
			payer: payers,
			financialAccount: financialAccounts,
			card: cards,
			category: categories,
			hasAttachments: sql<boolean>`EXISTS (
				SELECT 1 FROM ${transactionAttachments}
				WHERE ${transactionAttachments.transactionId} = ${transactions.id}
			)`,
		})
		.from(transactions)
		.leftJoin(payers, eq(transactions.payerId, payers.id))
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.leftJoin(cards, eq(transactions.cardId, cards.id))
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(
			buildTransactionsWhere({
				filters,
				extraFilters,
				excludeInitialBalanceFromIncome,
			}),
		)
		.orderBy(desc(transactions.purchaseDate), desc(transactions.createdAt));

	const transactionRows =
		typeof limit === "number"
			? await baseQuery.limit(limit).offset(offset ?? 0)
			: await baseQuery;

	return mapTransactionRows(transactionRows);
}

export async function fetchTransactionFilterSources(userId: string) {
	const [payerRows, accountRows, cardRows, categoryRows] = await Promise.all([
		db.query.payers.findMany({
			where: eq(payers.userId, userId),
		}),
		db.query.financialAccounts.findMany({
			where: and(
				eq(financialAccounts.userId, userId),
				eq(financialAccounts.status, "Ativa"),
			),
		}),
		db.query.cards.findMany({
			where: and(eq(cards.userId, userId), eq(cards.status, "Ativo")),
		}),
		db.query.categories.findMany({
			where: eq(categories.userId, userId),
		}),
	]);

	return { payerRows, accountRows, cardRows, categoryRows };
}

export async function fetchTransactionsWithRelations(
	input: BaseTransactionQueryInput,
) {
	return selectTransactionsWithRelations(input);
}

export async function fetchTransactions(filters: SQL[]) {
	return fetchTransactionsWithRelations({ filters });
}

export async function fetchTransactionsPage(
	filters: SQL[],
	{
		page,
		pageSize,
	}: {
		page: number;
		pageSize: number;
	},
): Promise<PaginatedTransactionsResult> {
	const [countRow] = await db
		.select({ total: count() })
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.leftJoin(cards, eq(transactions.cardId, cards.id))
		.where(buildTransactionsWhere({ filters }));

	const totalItems = Number(countRow?.total ?? 0);
	const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
	const currentPage = Math.min(page, totalPages);
	const rows = await selectTransactionsWithRelations({
		filters,
		limit: pageSize,
		offset: (currentPage - 1) * pageSize,
	});

	return {
		rows,
		totalItems,
		page: currentPage,
		pageSize,
		totalPages,
	};
}

export async function fetchTransactionsPageWithRelations({
	filters,
	page,
	pageSize,
	extraFilters = [],
	excludeInitialBalanceFromIncome = DEFAULT_EXCLUDE_INITIAL_BALANCE,
}: BaseTransactionQueryInput & {
	page: number;
	pageSize: number;
}): Promise<PaginatedTransactionsResult> {
	const [countRow] = await db
		.select({ total: count() })
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.leftJoin(cards, eq(transactions.cardId, cards.id))
		.where(
			buildTransactionsWhere({
				filters,
				extraFilters,
				excludeInitialBalanceFromIncome,
			}),
		);

	const totalItems = Number(countRow?.total ?? 0);
	const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
	const currentPage = Math.min(page, totalPages);
	const rows = await selectTransactionsWithRelations({
		filters,
		extraFilters,
		excludeInitialBalanceFromIncome,
		limit: pageSize,
		offset: (currentPage - 1) * pageSize,
	});

	return {
		rows,
		totalItems,
		page: currentPage,
		pageSize,
		totalPages,
	};
}

export async function fetchRecentEstablishments(
	userId: string,
): Promise<string[]> {
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	const results = await db
		.select({ name: transactions.name })
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				gte(transactions.purchaseDate, threeMonthsAgo),
				sql`TRIM(${transactions.name}) <> ''`,
				sql`LOWER(${transactions.name}) NOT LIKE 'pagamento fatura%'`,
			),
		)
		.groupBy(transactions.name)
		.orderBy(sql`MAX(${transactions.purchaseDate}) DESC`)
		.limit(100);

	return results
		.map((row) => row.name)
		.filter((name): name is string => name !== null);
}
