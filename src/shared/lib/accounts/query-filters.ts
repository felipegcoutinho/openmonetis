import { eq, isNull, or, sql } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";

export const excludeTransactionsFromExcludedAccounts = () =>
	or(
		isNull(transactions.accountId),
		isNull(financialAccounts.excludeFromBalance),
		eq(financialAccounts.excludeFromBalance, false),
	) ?? sql`true`;
