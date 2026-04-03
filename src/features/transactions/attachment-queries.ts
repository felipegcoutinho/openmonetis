import { and, eq } from "drizzle-orm";
import { attachments, transactionAttachments, transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
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
		.select({ id: transactions.id })
		.from(transactions)
		.where(
			and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
		);

	if (!transaction) {
		return [];
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
			transactions,
			and(
				eq(transactionAttachments.transactionId, transactions.id),
				eq(transactions.userId, userId),
			),
		)
		.innerJoin(
			attachments,
			and(
				eq(transactionAttachments.attachmentId, attachments.id),
				eq(attachments.userId, userId),
			),
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
