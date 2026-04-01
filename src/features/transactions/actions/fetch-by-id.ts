"use server";

import { eq } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { mapTransactionsData } from "@/features/transactions/page-helpers";
import { fetchTransactionsWithRelations } from "@/features/transactions/queries";
import { getUser } from "@/shared/lib/auth/server";
import type { TransactionItem } from "../components/types";

export async function fetchTransactionByIdAction(
	transactionId: string,
): Promise<TransactionItem | null> {
	const user = await getUser();
	const rows = await fetchTransactionsWithRelations({
		filters: [
			eq(transactions.id, transactionId),
			eq(transactions.userId, user.id),
		],
		excludeInitialBalanceFromIncome: false,
	});
	const mapped = mapTransactionsData(rows);
	return mapped[0] ?? null;
}
