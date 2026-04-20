import { and, asc, eq, gte, inArray, lte, sum } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import type { DashboardCardMetrics } from "@/features/dashboard/overview/dashboard-metrics-queries";
import type {
	IncomeExpenseBalanceData,
	MonthData,
} from "@/features/dashboard/overview/income-expense-balance-queries";
import {
	buildDashboardAdminFilters,
	excludeAutoInvoiceEntries,
	excludeInitialBalanceWhenConfigured,
	excludeTransactionsFromExcludedAccounts,
} from "@/features/dashboard/transaction-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber } from "@/shared/utils/number";
import {
	addMonthsToPeriod,
	buildPeriodRange,
	buildPeriodWindow,
	comparePeriods,
	formatPeriodMonthShort,
	getCurrentPeriod,
	getPreviousPeriod,
} from "@/shared/utils/period";

const TRANSACTION_TYPE_INCOME = "Receita";
const TRANSACTION_TYPE_EXPENSE = "Despesa";
const TRANSACTION_TYPE_TRANSFER = "Transferência";

type PeriodTotals = {
	receitas: number;
	despesas: number;
	transferAdjustment: number;
	balanco: number;
};

type PeriodSummaryRow = {
	period: string | null;
	transactionType: string;
	totalAmount: string | number | null;
	accountExcludeFromBalance: boolean | null;
};

type DashboardPeriodOverview = {
	metrics: DashboardCardMetrics;
	incomeExpenseBalanceData: IncomeExpenseBalanceData;
};

const createEmptyTotals = (): PeriodTotals => ({
	receitas: 0,
	despesas: 0,
	transferAdjustment: 0,
	balanco: 0,
});

const ensurePeriodTotals = (
	store: Map<string, PeriodTotals>,
	period: string,
): PeriodTotals => {
	const existing = store.get(period);
	if (existing) {
		return existing;
	}

	const totals = createEmptyTotals();
	store.set(period, totals);
	return totals;
};

const generateLast6Months = (currentPeriod: string): string[] => {
	try {
		return buildPeriodWindow(currentPeriod, 6);
	} catch {
		return buildPeriodWindow(getCurrentPeriod(), 6);
	}
};

const emptyOverview = (period: string): DashboardPeriodOverview => {
	const previousPeriod = getPreviousPeriod(period);

	return {
		metrics: {
			period,
			previousPeriod,
			receitas: { current: 0, previous: 0 },
			despesas: { current: 0, previous: 0 },
			balanco: { current: 0, previous: 0 },
			previsto: { current: 0, previous: 0 },
		},
		incomeExpenseBalanceData: { months: [] },
	};
};

export async function fetchDashboardPeriodOverview(
	userId: string,
	period: string,
): Promise<DashboardPeriodOverview> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return emptyOverview(period);
	}

	const previousPeriod = getPreviousPeriod(period);
	const chartPeriods = generateLast6Months(period);
	const startPeriod = addMonthsToPeriod(period, -24);

	const rows = (await db
		.select({
			period: transactions.period,
			transactionType: transactions.transactionType,
			totalAmount: sum(transactions.amount).as("total"),
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
				gte(transactions.period, startPeriod),
				lte(transactions.period, period),
				inArray(transactions.transactionType, [
					TRANSACTION_TYPE_INCOME,
					TRANSACTION_TYPE_EXPENSE,
					TRANSACTION_TYPE_TRANSFER,
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
		)
		.orderBy(
			asc(transactions.period),
			asc(transactions.transactionType),
		)) as PeriodSummaryRow[];

	const periodTotals = new Map<string, PeriodTotals>();

	for (const row of rows) {
		if (!row.period) {
			continue;
		}

		const totals = ensurePeriodTotals(periodTotals, row.period);
		const total = safeToNumber(row.totalAmount);

		if (row.transactionType === TRANSACTION_TYPE_INCOME) {
			totals.receitas += total;
		} else if (row.transactionType === TRANSACTION_TYPE_EXPENSE) {
			totals.despesas += Math.abs(total);
		} else if (
			row.transactionType === TRANSACTION_TYPE_TRANSFER &&
			row.accountExcludeFromBalance === false
		) {
			totals.transferAdjustment += total;
		}
	}

	ensurePeriodTotals(periodTotals, period);
	ensurePeriodTotals(periodTotals, previousPeriod);

	const earliestPeriod =
		periodTotals.size > 0 ? Array.from(periodTotals.keys()).sort()[0] : period;
	const startRangePeriod =
		comparePeriods(earliestPeriod, previousPeriod) <= 0
			? earliestPeriod
			: previousPeriod;
	const periodRange = buildPeriodRange(startRangePeriod, period);
	const forecastByPeriod = new Map<string, number>();
	let runningForecast = 0;

	for (const key of periodRange) {
		const totals = ensurePeriodTotals(periodTotals, key);
		totals.balanco =
			totals.receitas - totals.despesas + totals.transferAdjustment;
		runningForecast += totals.balanco;
		forecastByPeriod.set(key, runningForecast);
	}

	const currentTotals = ensurePeriodTotals(periodTotals, period);
	const previousTotals = ensurePeriodTotals(periodTotals, previousPeriod);
	const months: MonthData[] = chartPeriods.map((chartPeriod) => {
		const entry = periodTotals.get(chartPeriod) ?? createEmptyTotals();

		return {
			month: chartPeriod,
			monthLabel: formatPeriodMonthShort(chartPeriod).toLowerCase(),
			income: entry.receitas,
			expense: entry.despesas,
			balance: entry.balanco,
		};
	});

	return {
		metrics: {
			period,
			previousPeriod,
			receitas: {
				current: currentTotals.receitas,
				previous: previousTotals.receitas,
			},
			despesas: {
				current: currentTotals.despesas,
				previous: previousTotals.despesas,
			},
			balanco: {
				current: currentTotals.balanco,
				previous: previousTotals.balanco,
			},
			previsto: {
				current: forecastByPeriod.get(period) ?? runningForecast,
				previous: forecastByPeriod.get(previousPeriod) ?? 0,
			},
		},
		incomeExpenseBalanceData: { months },
	};
}
