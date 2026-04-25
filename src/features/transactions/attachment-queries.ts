import { eq } from "drizzle-orm";
import { attachments, transactionAttachments, transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getPayerAccess } from "@/shared/lib/payers/access";
import { createPresignedGetUrl } from "@/shared/lib/storage/presign";

export type TransactionAttachmentListItem = {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	createdAt: string;
	url: string;
};

export async function fetchTransactionAttachments(
	userId: string,
	transactionId: string,
): Promise<TransactionAttachmentListItem[]> {
	const [transaction] = await db
		.select({
			id: transactions.id,
			userId: transactions.userId,
			payerId: transactions.payerId,
		})
		.from(transactions)
		.where(eq(transactions.id, transactionId));

	if (!transaction) {
		return [];
	}

	if (transaction.userId !== userId) {
		if (!transaction.payerId) return [];
		const access = await getPayerAccess(userId, transaction.payerId);
		if (!access) return [];
	}

	const rows = await db
		.select({
			attachmentId: transactionAttachments.attachmentId,
			fileName: attachments.fileName,
			fileSize: attachments.fileSize,
			mimeType: attachments.mimeType,
			fileKey: attachments.fileKey,
			createdAt: attachments.createdAt,
		})
		.from(transactionAttachments)
		.innerJoin(
			attachments,
			eq(transactionAttachments.attachmentId, attachments.id),
		)
		.where(eq(transactionAttachments.transactionId, transactionId));

	return Promise.all(
		rows.map(async (row) => ({
			attachmentId: row.attachmentId,
			fileName: row.fileName,
			fileSize: row.fileSize,
			mimeType: row.mimeType,
			createdAt: row.createdAt.toISOString(),
			url: await createPresignedGetUrl(row.fileKey),
		})),
	);
}
