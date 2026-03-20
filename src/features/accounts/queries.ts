import { and, eq, ilike, not, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { loadLogoOptions } from "@/shared/lib/logo/options";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export type AccountData = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	note: string | null;
	logo: string | null;
	initialBalance: number;
	balance: number;
	excludeFromBalance: boolean;
	excludeInitialBalanceFromIncome: boolean;
};

async function fetchAccountsByStatus(
	userId: string,
	archived: boolean,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	const adminPayerId = await getAdminPayerId(userId);

	const [accountRows, logoOptions] = await Promise.all([
		db
			.select({
				id: financialAccounts.id,
				name: financialAccounts.name,
				accountType: financialAccounts.accountType,
				status: financialAccounts.status,
				note: financialAccounts.note,
				logo: financialAccounts.logo,
				initialBalance: financialAccounts.initialBalance,
				excludeFromBalance: financialAccounts.excludeFromBalance,
				excludeInitialBalanceFromIncome:
					financialAccounts.excludeInitialBalanceFromIncome,
				balanceMovements: sql<number>`
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
			.from(financialAccounts)
			.leftJoin(
				transactions,
				and(
					eq(transactions.accountId, financialAccounts.id),
					eq(transactions.userId, userId),
					eq(transactions.isSettled, true),
					adminPayerId ? eq(transactions.payerId, adminPayerId) : sql`false`,
				),
			)
			.where(
				and(
					eq(financialAccounts.userId, userId),
					archived
						? ilike(financialAccounts.status, "inativa")
						: not(ilike(financialAccounts.status, "inativa")),
				),
			)
			.groupBy(
				financialAccounts.id,
				financialAccounts.name,
				financialAccounts.accountType,
				financialAccounts.status,
				financialAccounts.note,
				financialAccounts.logo,
				financialAccounts.initialBalance,
				financialAccounts.excludeFromBalance,
				financialAccounts.excludeInitialBalanceFromIncome,
			),
		loadLogoOptions(),
	]);

	const accounts = accountRows.map((account) => ({
		id: account.id,
		name: account.name,
		accountType: account.accountType,
		status: account.status,
		note: account.note,
		logo: account.logo,
		initialBalance: Number(account.initialBalance ?? 0),
		balance:
			Number(account.initialBalance ?? 0) +
			Number(account.balanceMovements ?? 0),
		excludeFromBalance: account.excludeFromBalance,
		excludeInitialBalanceFromIncome: account.excludeInitialBalanceFromIncome,
	}));

	return { accounts, logoOptions };
}

export async function fetchAccountsForUser(
	userId: string,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	return fetchAccountsByStatus(userId, false);
}

export async function fetchInactiveForUser(
	userId: string,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	return fetchAccountsByStatus(userId, true);
}

export async function fetchAllAccountsForUser(userId: string): Promise<{
	activeAccounts: AccountData[];
	archivedAccounts: AccountData[];
	logoOptions: string[];
}> {
	const [activeData, archivedData] = await Promise.all([
		fetchAccountsForUser(userId),
		fetchInactiveForUser(userId),
	]);

	return {
		activeAccounts: activeData.accounts,
		archivedAccounts: archivedData.accounts,
		logoOptions: activeData.logoOptions,
	};
}
