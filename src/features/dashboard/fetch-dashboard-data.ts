import { unstable_cache } from "next/cache";
import { fetchDashboardAccounts } from "./accounts-queries";
import { fetchDashboardBills } from "./bills-queries";
import { fetchExpensesByCategory } from "./categories/expenses-by-category-queries";
import { fetchIncomeByCategory } from "./categories/income-by-category-queries";
import { fetchDashboardCardMetrics } from "./dashboard-metrics-queries";
import { fetchInstallmentExpenses } from "./expenses/installment-expenses-queries";
import { fetchRecurringExpenses } from "./expenses/recurring-expenses-queries";
import { fetchTopExpenses } from "./expenses/top-expenses-queries";
import { fetchGoalsProgressData } from "./goals-progress-queries";
import { fetchIncomeExpenseBalance } from "./income-expense-balance-queries";
import { fetchDashboardInvoices } from "./invoices-queries";
import { fetchDashboardNotes } from "./notes-queries";
import { fetchDashboardPagadores } from "./payers-queries";
import { fetchPaymentConditions } from "./payments/payment-conditions-queries";
import { fetchPaymentMethods } from "./payments/payment-methods-queries";
import { fetchPaymentStatus } from "./payments/payment-status-queries";
import { fetchPurchasesByCategory } from "./purchases-by-category-queries";
import { fetchRecurringSeries } from "./recurring/recurring-series-queries";
import { fetchTopEstablishments } from "./top-establishments-queries";

async function fetchDashboardDataInternal(userId: string, period: string) {
	const [
		metrics,
		accountsSnapshot,
		invoicesSnapshot,
		billsSnapshot,
		goalsProgressData,
		paymentStatusData,
		incomeExpenseBalanceData,
		pagadoresSnapshot,
		notesData,
		paymentConditionsData,
		paymentMethodsData,
		recurringExpensesData,
		installmentExpensesData,
		topEstablishmentsData,
		topExpensesAll,
		topExpensesCardOnly,
		purchasesByCategoryData,
		incomeByCategoryData,
		expensesByCategoryData,
		recurringSeriesData,
	] = await Promise.all([
		fetchDashboardCardMetrics(userId, period),
		fetchDashboardAccounts(userId),
		fetchDashboardInvoices(userId, period),
		fetchDashboardBills(userId, period),
		fetchGoalsProgressData(userId, period),
		fetchPaymentStatus(userId, period),
		fetchIncomeExpenseBalance(userId, period),
		fetchDashboardPagadores(userId, period),
		fetchDashboardNotes(userId),
		fetchPaymentConditions(userId, period),
		fetchPaymentMethods(userId, period),
		fetchRecurringExpenses(userId, period),
		fetchInstallmentExpenses(userId, period),
		fetchTopEstablishments(userId, period),
		fetchTopExpenses(userId, period, false),
		fetchTopExpenses(userId, period, true),
		fetchPurchasesByCategory(userId, period),
		fetchIncomeByCategory(userId, period),
		fetchExpensesByCategory(userId, period),
		fetchRecurringSeries(userId),
	]);

	return {
		metrics,
		accountsSnapshot,
		invoicesSnapshot,
		billsSnapshot,
		goalsProgressData,
		paymentStatusData,
		incomeExpenseBalanceData,
		pagadoresSnapshot,
		notesData,
		paymentConditionsData,
		paymentMethodsData,
		recurringExpensesData,
		installmentExpensesData,
		topEstablishmentsData,
		topExpensesAll,
		topExpensesCardOnly,
		purchasesByCategoryData,
		incomeByCategoryData,
		expensesByCategoryData,
		recurringSeriesData,
	};
}

/**
 * Cached dashboard data fetcher.
 * Uses unstable_cache with tags for revalidation on mutations.
 * Cache is keyed by userId + period, and invalidated via "dashboard" tag.
 */
export function fetchDashboardData(userId: string, period: string) {
	return unstable_cache(
		() => fetchDashboardDataInternal(userId, period),
		[`dashboard-${userId}-${period}`],
		{
			tags: ["dashboard", `dashboard-${userId}`],
			revalidate: 60,
		},
	)();
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
