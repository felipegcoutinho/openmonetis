import { cacheLife, cacheTag } from "next/cache";
import { fetchAttachmentsForPeriod } from "@/features/attachments/queries";
import { fetchDashboardAccounts } from "./accounts-queries";
import { fetchDashboardCategoryOverview } from "./category-overview-queries";
import { fetchDashboardCurrentPeriodOverview } from "./current-period-overview-queries";
import { fetchDashboardInboxSnapshot } from "./inbox-snapshot-queries";
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
		allAttachments,
		inboxSnapshot,
	] = await Promise.all([
		fetchDashboardPeriodOverview(userId, period),
		fetchDashboardAccounts(userId),
		fetchDashboardInvoices(userId, period),
		fetchDashboardCurrentPeriodOverview(userId, period),
		fetchDashboardCategoryOverview(userId, period),
		fetchDashboardPayers(userId, period),
		fetchDashboardNotes(userId),
		fetchAttachmentsForPeriod(userId, period),
		fetchDashboardInboxSnapshot(userId),
	]);

	const attachmentsSnapshot = allAttachments.reduce(
		(acc, attachment, index) => {
			acc.totalBytes += attachment.fileSize;
			if (attachment.mimeType.startsWith("image/")) acc.imageCount++;
			if (attachment.mimeType === "application/pdf") acc.pdfCount++;
			if (index < 5) acc.recentAttachments.push(attachment);
			return acc;
		},
		{
			totalCount: allAttachments.length,
			totalBytes: 0,
			imageCount: 0,
			pdfCount: 0,
			recentAttachments: [] as typeof allAttachments,
		},
	);

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
		attachmentsSnapshot,
		inboxSnapshot,
	};
}

/**
 * Cached dashboard data fetcher.
 * Uses "use cache" with tags for revalidation on mutations.
 * Cache is keyed by userId + period, and invalidated via user-scoped tags.
 */
export async function fetchDashboardData(userId: string, period: string) {
	"use cache";
	cacheTag(`dashboard-${userId}`);
	cacheLife({ revalidate: 3 });
	return fetchDashboardDataInternal(userId, period);
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
