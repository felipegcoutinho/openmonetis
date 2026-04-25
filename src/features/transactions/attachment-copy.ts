import { randomUUID } from "node:crypto";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { attachments, transactionAttachments, transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getPayerAccess } from "@/shared/lib/payers/access";
import { deleteS3Object } from "@/shared/lib/storage/presign";
import { S3_BUCKET, s3 } from "@/shared/lib/storage/s3-client";

const SAFE_EXTENSION = /^[a-z0-9]{1,10}$/i;

function sanitizeExtension(fileKey: string): string {
	const ext = fileKey.split(".").pop() ?? "";
	return SAFE_EXTENSION.test(ext) ? ext.toLowerCase() : "bin";
}

export async function copyAttachmentsForImport({
	sourceTransactionId,
	targetTransactionIds,
	targetUserId,
}: {
	sourceTransactionId: string;
	targetTransactionIds: string[];
	targetUserId: string;
}): Promise<void> {
	if (targetTransactionIds.length === 0) return;

	const [source] = await db
		.select({
			id: transactions.id,
			userId: transactions.userId,
			payerId: transactions.payerId,
		})
		.from(transactions)
		.where(eq(transactions.id, sourceTransactionId));

	if (!source) return;

	if (source.userId !== targetUserId) {
		if (!source.payerId) return;
		const access = await getPayerAccess(targetUserId, source.payerId);
		if (!access) return;
	}

	const sourceAttachments = await db
		.select({
			fileKey: attachments.fileKey,
			fileName: attachments.fileName,
			fileSize: attachments.fileSize,
			mimeType: attachments.mimeType,
		})
		.from(transactionAttachments)
		.innerJoin(
			attachments,
			eq(transactionAttachments.attachmentId, attachments.id),
		)
		.where(eq(transactionAttachments.transactionId, sourceTransactionId));

	if (sourceAttachments.length === 0) return;

	for (const src of sourceAttachments) {
		const newFileKey = `${targetUserId}/${randomUUID()}.${sanitizeExtension(src.fileKey)}`;

		try {
			await s3.send(
				new CopyObjectCommand({
					Bucket: S3_BUCKET,
					CopySource: `${S3_BUCKET}/${src.fileKey}`,
					Key: newFileKey,
					ContentType: src.mimeType,
					MetadataDirective: "COPY",
				}),
			);
		} catch (error) {
			console.error("Falha ao copiar anexo no S3:", error);
			continue;
		}

		try {
			const [newAttachment] = await db
				.insert(attachments)
				.values({
					userId: targetUserId,
					fileKey: newFileKey,
					fileName: src.fileName,
					fileSize: src.fileSize,
					mimeType: src.mimeType,
				})
				.returning({ id: attachments.id });

			if (!newAttachment) {
				await deleteS3Object(newFileKey);
				continue;
			}

			await db.insert(transactionAttachments).values(
				targetTransactionIds.map((tid) => ({
					transactionId: tid,
					attachmentId: newAttachment.id,
				})),
			);
		} catch (error) {
			console.error("Falha ao registrar anexo copiado:", error);
			await deleteS3Object(newFileKey).catch(() => {});
		}
	}
}
