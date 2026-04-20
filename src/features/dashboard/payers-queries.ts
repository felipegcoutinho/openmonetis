import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { financialAccounts, payers, transactions } from "@/db/schema";
import { excludeTransactionsFromExcludedAccounts } from "@/features/dashboard/transaction-filters";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

export type DashboardPagador = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	totalExpenses: number;
	previousExpenses: number;
	percentageChange: number | null;
	isAdmin: boolean;
};

type DashboardPayersSnapshot = {
	payers: DashboardPagador[];
	totalExpenses: number;
};

export async function fetchDashboardPayers(
	userId: string,
	period: string,
): Promise<DashboardPayersSnapshot> {
	const previousPeriod = getPreviousPeriod(period);

	const rows = await db
		.select({
			id: payers.id,
			name: payers.name,
			email: payers.email,
			avatarUrl: payers.avatarUrl,
			role: payers.role,
			period: transactions.period,
			totalExpenses: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
		})
		.from(transactions)
		.innerJoin(payers, eq(transactions.payerId, payers.id))
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				eq(transactions.userId, userId),
				inArray(transactions.period, [period, previousPeriod]),
				eq(transactions.transactionType, "Despesa"),
				excludeTransactionsFromExcludedAccounts(),
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
			),
		)
		.groupBy(
			payers.id,
			payers.name,
			payers.email,
			payers.avatarUrl,
			payers.role,
			transactions.period,
		)
		.orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

	const groupedPagadores = new Map<
		string,
		{
			id: string;
			name: string;
			email: string | null;
			avatarUrl: string | null;
			isAdmin: boolean;
			currentExpenses: number;
			previousExpenses: number;
		}
	>();

	for (const row of rows) {
		const entry = groupedPagadores.get(row.id) ?? {
			id: row.id,
			name: row.name,
			email: row.email,
			avatarUrl: row.avatarUrl,
			isAdmin: row.role === PAYER_ROLE_ADMIN,
			currentExpenses: 0,
			previousExpenses: 0,
		};

		const amount = toNumber(row.totalExpenses);
		if (row.period === period) {
			entry.currentExpenses = amount;
		} else {
			entry.previousExpenses = amount;
		}

		groupedPagadores.set(row.id, entry);
	}

	const payerList = Array.from(groupedPagadores.values())
		.filter((p) => p.currentExpenses > 0)
		.map((pagador) => ({
			id: pagador.id,
			name: pagador.name,
			email: pagador.email,
			avatarUrl: pagador.avatarUrl,
			totalExpenses: pagador.currentExpenses,
			previousExpenses: pagador.previousExpenses,
			percentageChange: calculatePercentageChange(
				pagador.currentExpenses,
				pagador.previousExpenses,
			),
			isAdmin: pagador.isAdmin,
		}))
		.sort((a, b) => b.totalExpenses - a.totalExpenses);

	const totalExpenses = payerList.reduce((sum, p) => sum + p.totalExpenses, 0);

	return {
		payers: payerList,
		totalExpenses,
	};
}
