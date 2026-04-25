import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import {
	cards,
	categories,
	financialAccounts,
	payerShares,
	payers,
	transactionAttachments,
	transactions,
	user as usersTable,
} from "@/db/schema";
import { db } from "@/shared/lib/db";

export type ShareData = {
	id: string;
	userId: string;
	name: string;
	email: string;
	createdAt: string;
};

export async function fetchPayerShares(payerId: string): Promise<ShareData[]> {
	const shareRows = await db
		.select({
			id: payerShares.id,
			sharedWithUserId: payerShares.sharedWithUserId,
			createdAt: payerShares.createdAt,
			userName: usersTable.name,
			userEmail: usersTable.email,
		})
		.from(payerShares)
		.innerJoin(usersTable, eq(payerShares.sharedWithUserId, usersTable.id))
		.where(eq(payerShares.payerId, payerId));

	return shareRows.map((share) => ({
		id: share.id,
		userId: share.sharedWithUserId,
		name: share.userName ?? "Usuário",
		email: share.userEmail ?? "email não informado",
		createdAt: share.createdAt?.toISOString() ?? new Date().toISOString(),
	}));
}

export async function fetchCurrentUserShare(
	payerId: string,
	userId: string,
): Promise<{ id: string; createdAt: string } | null> {
	const shareRow = await db.query.payerShares.findFirst({
		columns: {
			id: true,
			createdAt: true,
		},
		where: and(
			eq(payerShares.payerId, payerId),
			eq(payerShares.sharedWithUserId, userId),
		),
	});

	if (!shareRow) {
		return null;
	}

	return {
		id: shareRow.id,
		createdAt: shareRow.createdAt?.toISOString() ?? new Date().toISOString(),
	};
}

export async function fetchPagadorLancamentos(filters: SQL[]) {
	const transactionRows = await db
		.select({
			transaction: transactions,
			payer: payers,
			financialAccount: financialAccounts,
			card: cards,
			category: categories,
			hasAttachments: sql<boolean>`EXISTS (
				SELECT 1 FROM ${transactionAttachments}
				WHERE ${transactionAttachments.transactionId} = ${transactions.id}
			)`,
		})
		.from(transactions)
		.leftJoin(payers, eq(transactions.payerId, payers.id))
		.leftJoin(
			financialAccounts,
			eq(transactions.accountId, financialAccounts.id),
		)
		.leftJoin(cards, eq(transactions.cardId, cards.id))
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(and(...filters))
		.orderBy(desc(transactions.purchaseDate), desc(transactions.createdAt));

	return transactionRows.map((row) => ({
		...row.transaction,
		payer: row.payer,
		financialAccount: row.financialAccount,
		card: row.card,
		category: row.category,
		hasAttachments: row.hasAttachments,
	}));
}
