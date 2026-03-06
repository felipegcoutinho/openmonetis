import { and, eq, sql } from "drizzle-orm";
import { contas, lancamentos, pagadores } from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/lib/contas/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";

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

export type DashboardAccountsSnapshot = {
	totalBalance: number;
	accounts: DashboardAccount[];
};

export async function fetchDashboardAccounts(
	userId: string,
): Promise<DashboardAccountsSnapshot> {
	const rows = await db
		.select({
			id: contas.id,
			name: contas.name,
			accountType: contas.accountType,
			status: contas.status,
			logo: contas.logo,
			initialBalance: contas.initialBalance,
			excludeFromBalance: contas.excludeFromBalance,
			balanceMovements: sql<number>`
        coalesce(
          sum(
            case
              when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${lancamentos.amount}
            end
          ),
          0
        )
      `,
		})
		.from(contas)
		.leftJoin(
			lancamentos,
			and(
				eq(lancamentos.contaId, contas.id),
				eq(lancamentos.userId, userId),
				eq(lancamentos.isSettled, true),
			),
		)
		.leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(contas.userId, userId),
				sql`(${lancamentos.id} IS NULL OR ${pagadores.role} = ${PAGADOR_ROLE_ADMIN})`,
			),
		)
		.groupBy(
			contas.id,
			contas.name,
			contas.accountType,
			contas.status,
			contas.logo,
			contas.initialBalance,
			contas.excludeFromBalance,
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
