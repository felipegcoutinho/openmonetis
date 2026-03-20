import { unstable_cache } from "next/cache";
import { fetchDashboardAccounts } from "./accounts-queries";
import { fetchDashboardCategoryOverview } from "./category-overview-queries";
import { fetchDashboardCurrentPeriodOverview } from "./current-period-overview-queries";
import { fetchDashboardInvoices } from "./invoices-queries";
import { fetchDashboardNotes } from "./notes-queries";
import { fetchDashboardPayers } from "./payers-queries";
import { fetchDashboardPeriodOverview } from "./period-overview-queries";

async function fetchDashboardDataInternal(userId: string, period: string) {
	const [
		periodOverview,
		accountsSnapshot,
		invoicesSnapshot,
		currentPeriodOverview,
		categoryOverview,
		pagadoresSnapshot,
		notesData,
	] = await Promise.all([
		fetchDashboardPeriodOverview(userId, period),
		fetchDashboardAccounts(userId),
		fetchDashboardInvoices(userId, period),
		fetchDashboardCurrentPeriodOverview(userId, period),
		fetchDashboardCategoryOverview(userId, period),
		fetchDashboardPayers(userId, period),
		fetchDashboardNotes(userId),
	]);

	return {
		metrics: periodOverview.metrics,
		accountsSnapshot,
		invoicesSnapshot,
		billsSnapshot: currentPeriodOverview.billsSnapshot,
		goalsProgressData: categoryOverview.goalsProgressData,
		paymentStatusData: currentPeriodOverview.paymentStatusData,
		incomeExpenseBalanceData: periodOverview.incomeExpenseBalanceData,
		pagadoresSnapshot,
		notesData,
		paymentConditionsData: currentPeriodOverview.paymentConditionsData,
		paymentMethodsData: currentPeriodOverview.paymentMethodsData,
		recurringExpensesData: currentPeriodOverview.recurringExpensesData,
		installmentExpensesData: currentPeriodOverview.installmentExpensesData,
		topEstablishmentsData: currentPeriodOverview.topEstablishmentsData,
		topExpensesAll: currentPeriodOverview.topExpensesAll,
		topExpensesCardOnly: currentPeriodOverview.topExpensesCardOnly,
		purchasesByCategoryData: currentPeriodOverview.purchasesByCategoryData,
		incomeByCategoryData: categoryOverview.incomeByCategoryData,
		expensesByCategoryData: categoryOverview.expensesByCategoryData,
	};
}

/**
 * Cached dashboard data fetcher.
 * Uses unstable_cache with tags for revalidation on mutations.
 * Cache is keyed by userId + period, and invalidated via user-scoped tags.
 */
export function fetchDashboardData(userId: string, period: string) {
	return unstable_cache(
		() => fetchDashboardDataInternal(userId, period),
		[`dashboard-${userId}-${period}`],
		{
			tags: [`dashboard-${userId}`],
			revalidate: 60,
		},
	)();
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
