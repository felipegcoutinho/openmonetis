import { eq, ilike, isNull, ne, not, or } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";

export { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";

type DashboardAdminFiltersParams = {
	userId: string;
	adminPayerId: string;
};

export const buildDashboardAdminFilters = ({
	userId,
	adminPayerId,
}: DashboardAdminFiltersParams) =>
	[
		eq(transactions.userId, userId),
		eq(transactions.payerId, adminPayerId),
	] as const;

export const excludeAutoInvoiceEntries = () =>
	or(
		isNull(transactions.note),
		not(ilike(transactions.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
	);

export const excludeInitialBalanceWhenConfigured = () =>
	or(
		isNull(transactions.note),
		ne(transactions.note, INITIAL_BALANCE_NOTE),
		isNull(financialAccounts.excludeInitialBalanceFromIncome),
		eq(financialAccounts.excludeInitialBalanceFromIncome, false),
	);
