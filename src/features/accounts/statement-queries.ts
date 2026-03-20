import { and, eq, lt, type SQL, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import {
	fetchTransactionsPageWithRelations,
	fetchTransactionsWithRelations,
} from "@/features/transactions/queries";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export type AccountSummaryData = {
	openingBalance: number;
	currentBalance: number;
	totalIncomes: number;
	totalExpenses: number;
};

export async function fetchAccountData(userId: string, accountId: string) {
	const account = await db.query.financialAccounts.findFirst({
		columns: {
			id: true,
			name: true,
			accountType: true,
			status: true,
			initialBalance: true,
			logo: true,
			note: true,
		},
		where: and(
			eq(financialAccounts.id, accountId),
			eq(financialAccounts.userId, userId),
		),
	});

	return account;
}

export async function fetchAccountSummary(
	userId: string,
	accountId: string,
	selectedPeriod: string,
): Promise<AccountSummaryData> {
	const account = await fetchAccountData(userId, accountId);
	if (!account) {
		throw new Error("Account not found");
	}

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		const initialBalance = Number(account.initialBalance ?? 0);
		return {
			openingBalance: initialBalance,
			currentBalance: initialBalance,
			totalIncomes: 0,
			totalExpenses: 0,
		};
	}

	const [periodSummary] = await db
		.select({
			netAmount: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${transactions.amount}
            end
          ),
          0
        )
      `,
			incomes: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.note} = ${INITIAL_BALANCE_NOTE} then 0
              when ${transactions.transactionType} = 'Receita' then ${transactions.amount}
              else 0
            end
          ),
          0
        )
      `,
			expenses: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.note} = ${INITIAL_BALANCE_NOTE} then 0
              when ${transactions.transactionType} = 'Despesa' then ${transactions.amount}
              else 0
            end
          ),
          0
        )
      `,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.accountId, accountId),
				eq(transactions.period, selectedPeriod),
				eq(transactions.isSettled, true),
				eq(transactions.payerId, adminPayerId),
			),
		);

	const [previousRow] = await db
		.select({
			previousMovements: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${transactions.amount}
            end
          ),
          0
        )
      `,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.accountId, accountId),
				lt(transactions.period, selectedPeriod),
				eq(transactions.isSettled, true),
				eq(transactions.payerId, adminPayerId),
			),
		);

	const initialBalance = Number(account.initialBalance ?? 0);
	const previousMovements = Number(previousRow?.previousMovements ?? 0);
	const openingBalance = initialBalance + previousMovements;
	const netAmount = Number(periodSummary?.netAmount ?? 0);
	const totalIncomes = Number(periodSummary?.incomes ?? 0);
	const totalExpenses = Math.abs(Number(periodSummary?.expenses ?? 0));
	const currentBalance = openingBalance + netAmount;

	return {
		openingBalance,
		currentBalance,
		totalIncomes,
		totalExpenses,
	};
}

export async function fetchAccountLancamentos(
	filters: SQL[],
	settledOnly = true,
) {
	const extraFilters = settledOnly ? [eq(transactions.isSettled, true)] : [];

	return fetchTransactionsWithRelations({
		filters,
		extraFilters,
		excludeInitialBalanceFromIncome: false,
	});
}

export async function fetchAccountLancamentosPage(
	filters: SQL[],
	{
		page,
		pageSize,
	}: {
		page: number;
		pageSize: number;
	},
	settledOnly = true,
) {
	const extraFilters = settledOnly ? [eq(transactions.isSettled, true)] : [];

	return fetchTransactionsPageWithRelations({
		filters,
		extraFilters,
		excludeInitialBalanceFromIncome: false,
		page,
		pageSize,
	});
}
