import { and, eq, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";

type RawDashboardAccount = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	logo: string | null;
	initialBalance: string | number | null;
	balanceMovements: unknown;
};

export type DashboardAccount = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	logo: string | null;
	initialBalance: number;
	balance: number;
	excludeFromBalance: boolean;
};

type DashboardAccountsSnapshot = {
	totalBalance: number;
	accounts: DashboardAccount[];
};

export async function fetchDashboardAccounts(
	userId: string,
): Promise<DashboardAccountsSnapshot> {
	const adminPayerId = await getAdminPayerId(userId);

	const rows = await db
		.select({
			id: financialAccounts.id,
			name: financialAccounts.name,
			accountType: financialAccounts.accountType,
			status: financialAccounts.status,
			logo: financialAccounts.logo,
			initialBalance: financialAccounts.initialBalance,
			excludeFromBalance: financialAccounts.excludeFromBalance,
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
		.where(eq(financialAccounts.userId, userId))
		.groupBy(
			financialAccounts.id,
			financialAccounts.name,
			financialAccounts.accountType,
			financialAccounts.status,
			financialAccounts.logo,
			financialAccounts.initialBalance,
			financialAccounts.excludeFromBalance,
		);

	const accounts = rows
		.map(
			(
				row: RawDashboardAccount & { excludeFromBalance: boolean },
			): DashboardAccount => {
				const initialBalance = toNumber(row.initialBalance);
				const balanceMovements = toNumber(row.balanceMovements);

				return {
					id: row.id,
					name: row.name,
					accountType: row.accountType,
					status: row.status,
					logo: row.logo,
					initialBalance,
					balance: initialBalance + balanceMovements,
					excludeFromBalance: row.excludeFromBalance,
				};
			},
		)
		.sort((a, b) => b.balance - a.balance);

	const totalBalance = accounts
		.filter((account) => !account.excludeFromBalance)
		.reduce((total, account) => total + account.balance, 0);

	return {
		totalBalance,
		accounts,
	};
}
