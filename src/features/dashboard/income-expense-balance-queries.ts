import { and, eq, inArray, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
	excludeTransactionsFromExcludedAccounts,
} from "@/features/dashboard/transaction-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import {
	buildPeriodWindow,
	formatPeriodMonthShort,
	getCurrentPeriod,
} from "@/shared/utils/period";

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

const generateLast6Months = (currentPeriod: string): string[] => {
	try {
		return buildPeriodWindow(currentPeriod, 6);
	} catch {
		return buildPeriodWindow(getCurrentPeriod(), 6);
	}
};

export async function fetchIncomeExpenseBalance(
	userId: string,
	currentPeriod: string,
): Promise<IncomeExpenseBalanceData> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { months: [] };
	}

	const periods = generateLast6Months(currentPeriod);

	// Single query: GROUP BY period + transactionType instead of 12 separate queries
	const rows = await db
		.select({
			period: transactions.period,
			transactionType: transactions.transactionType,
			total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			accountExcludeFromBalance: financialAccounts.excludeFromBalance,
		})
		.from(transactions)
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.where(
			and(
				...buildDashboardAdminFilters({ userId, adminPayerId }),
				inArray(transactions.period, periods),
				inArray(transactions.transactionType, [
					"Receita",
					"Despesa",
					"Transferência",
				]),
				excludeAutoInvoiceEntries(),
				excludeInitialBalanceWhenConfigured(),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.groupBy(
			transactions.period,
			transactions.transactionType,
			financialAccounts.excludeFromBalance,
		);

	// Build lookup from query results
	const dataMap = new Map<
		string,
		{ income: number; expense: number; transferAdjustment: number }
	>();
	for (const row of rows) {
		if (!row.period) continue;
		const entry = dataMap.get(row.period) ?? {
			income: 0,
			expense: 0,
			transferAdjustment: 0,
		};
		const total = toNumber(row.total);
		if (row.transactionType === "Receita") {
			entry.income += Math.abs(total);
		} else if (row.transactionType === "Despesa") {
			entry.expense += Math.abs(total);
		} else if (
			row.transactionType === "Transferência" &&
			row.accountExcludeFromBalance === false
		) {
			entry.transferAdjustment += total;
		}
		dataMap.set(row.period, entry);
	}

	// Build result array preserving period order
	const months = periods.map((period) => {
		const entry = dataMap.get(period) ?? {
			income: 0,
			expense: 0,
			transferAdjustment: 0,
		};

		return {
			month: period,
			monthLabel: formatPeriodMonthShort(period).toLowerCase(),
			income: entry.income,
			expense: entry.expense,
			balance: entry.income - entry.expense + entry.transferAdjustment,
		};
	});

	return { months };
}
