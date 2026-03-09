import { and, eq, inArray, sql } from "drizzle-orm";
import { contas, lancamentos } from "@/db/schema";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
} from "@/lib/dashboard/lancamento-filters";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
import { safeToNumber as toNumber } from "@/lib/utils/number";
import {
	buildPeriodWindow,
	formatPeriodMonthShort,
	getCurrentPeriod,
} from "@/lib/utils/period";

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
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { months: [] };
	}

	const periods = generateLast6Months(currentPeriod);

	// Single query: GROUP BY period + transactionType instead of 12 separate queries
	const rows = await db
		.select({
			period: lancamentos.period,
			transactionType: lancamentos.transactionType,
			total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
		})
		.from(lancamentos)
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				...buildDashboardAdminFilters({ userId, adminPagadorId }),
				inArray(lancamentos.period, periods),
				inArray(lancamentos.transactionType, ["Receita", "Despesa"]),
				excludeAutoInvoiceEntries(),
				excludeInitialBalanceWhenConfigured(),
			),
		)
		.groupBy(lancamentos.period, lancamentos.transactionType);

	// Build lookup from query results
	const dataMap = new Map<string, { income: number; expense: number }>();
	for (const row of rows) {
		if (!row.period) continue;
		const entry = dataMap.get(row.period) ?? { income: 0, expense: 0 };
		const total = Math.abs(toNumber(row.total));
		if (row.transactionType === "Receita") {
			entry.income = total;
		} else if (row.transactionType === "Despesa") {
			entry.expense = total;
		}
		dataMap.set(row.period, entry);
	}

	// Build result array preserving period order
	const months = periods.map((period) => {
		const entry = dataMap.get(period) ?? { income: 0, expense: 0 };

		return {
			month: period,
			monthLabel: formatPeriodMonthShort(period).toLowerCase(),
			income: entry.income,
			expense: entry.expense,
			balance: entry.income - entry.expense,
		};
	});

	return { months };
}
