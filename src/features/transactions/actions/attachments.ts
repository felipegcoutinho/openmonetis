"use server";

import crypto, { randomUUID } from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { attachments, transactionAttachments, transactions } from "@/db/schema";
import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE,
} from "@/features/transactions/attachments-config";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	createPresignedGetUrl,
	createPresignedPutUrl,
	deleteS3Object,
	headS3Object,
} from "@/shared/lib/storage/presign";
import type { ActionResult } from "@/shared/lib/types/actions";

const UPLOAD_TOKEN_EXPIRY_SECONDS = 10 * 60;

const presignSchema = z.object({
	fileName: z.string().min(1),
	mimeType: z.enum(ALLOWED_MIME_TYPES),
	fileSize: z.number().max(MAX_FILE_SIZE, "Arquivo deve ter no máximo 50MB."),
	transactionId: z.string().uuid(),
});

const confirmSchema = z.object({
	uploadToken: z.string().min(1),
	applyToSeries: z.boolean().default(false),
});

const detachSchema = z.object({
	attachmentId: z.string().uuid(),
	transactionId: z.string().uuid(),
});

type PresignResult =
	| {
			success: true;
			presignedUrl: string;
			fileKey: string;
			uploadToken: string;
	  }
	| { success: false; error: string };

type UploadTokenPayload = {
	userId: string;
	transactionId: string;
	fileKey: string;
	fileName: string;
	mimeType: (typeof ALLOWED_MIME_TYPES)[number];
	fileSize: number;
	exp: number;
};

function getUploadTokenSecret(): string {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error(
			"BETTER_AUTH_SECRET is required. Set it in your .env file.",
		);
	}
	return secret;
}

function base64UrlEncode(value: string): string {
	return Buffer.from(value)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

function base64UrlDecode(value: string): string {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const pad = normalized.length % 4;
	const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
	return Buffer.from(padded, "base64").toString("utf8");
}

function signUploadToken(payload: UploadTokenPayload): string {
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const signature = crypto
		.createHmac("sha256", getUploadTokenSecret())
		.update(encodedPayload)
		.digest("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");

	return `${encodedPayload}.${signature}`;
}

function verifyUploadToken(token: string): UploadTokenPayload | null {
	try {
		const [encodedPayload, signature] = token.split(".");
		if (!encodedPayload || !signature) return null;

		const expectedSignature = crypto
			.createHmac("sha256", getUploadTokenSecret())
			.update(encodedPayload)
			.digest("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		if (
			!crypto.timingSafeEqual(
				Buffer.from(signature),
				Buffer.from(expectedSignature),
			)
		) {
			return null;
		}

		const payload = JSON.parse(
			base64UrlDecode(encodedPayload),
		) as UploadTokenPayload;
		const now = Math.floor(Date.now() / 1000);

		if (payload.exp < now) return null;
		if (!payload.fileKey.startsWith(`${payload.userId}/`)) return null;
		if (!ALLOWED_MIME_TYPES.includes(payload.mimeType)) return null;
		if (payload.fileSize <= 0 || payload.fileSize > MAX_FILE_SIZE) return null;

		return payload;
	} catch {
		return null;
	}
}

export async function getPresignedUploadUrlAction(input: {
	fileName: string;
	mimeType: string;
	fileSize: number;
	transactionId: string;
}): Promise<PresignResult> {
	try {
		const user = await getUser();
		const data = presignSchema.parse(input);

		const [transaction] = await db
			.select({ id: transactions.id })
			.from(transactions)
			.where(
				and(
					eq(transactions.id, data.transactionId),
					eq(transactions.userId, user.id),
				),
			);

		if (!transaction) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
		const fileKey = `${user.id}/${randomUUID()}.${ext}`;
		const presignedUrl = await createPresignedPutUrl(fileKey, data.mimeType);
		const uploadToken = signUploadToken({
			userId: user.id,
			transactionId: data.transactionId,
			fileKey,
			fileName: data.fileName,
			mimeType: data.mimeType,
			fileSize: data.fileSize,
			exp: Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_EXPIRY_SECONDS,
		});

		return { success: true, presignedUrl, fileKey, uploadToken };
	} catch (error) {
		const result = handleActionError(error);
		if (!result.success) return { success: false, error: result.error };
		return { success: false, error: "Erro inesperado." };
	}
}

export async function confirmAttachmentUploadAction(input: {
	uploadToken: string;
	applyToSeries?: boolean;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = confirmSchema.parse(input);
		const uploadPayload = verifyUploadToken(data.uploadToken);

		if (!uploadPayload || uploadPayload.userId !== user.id) {
			return { success: false, error: "Upload de anexo inválido ou expirado." };
		}

		const [transaction] = await db
			.select({ id: transactions.id, seriesId: transactions.seriesId })
			.from(transactions)
			.where(
				and(
					eq(transactions.id, uploadPayload.transactionId),
					eq(transactions.userId, user.id),
				),
			);

		if (!transaction) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		const objectMetadata = await headS3Object(uploadPayload.fileKey);

		if (!objectMetadata.contentLength || objectMetadata.contentLength <= 0) {
			return { success: false, error: "Arquivo enviado não encontrado." };
		}

		if (objectMetadata.contentLength > MAX_FILE_SIZE) {
			return {
				success: false,
				error: "O arquivo enviado excede o limite permitido de 50MB.",
			};
		}

		if (objectMetadata.contentLength !== uploadPayload.fileSize) {
			return {
				success: false,
				error:
					"O tamanho do arquivo enviado não confere com o upload autorizado.",
			};
		}

		if (objectMetadata.contentType !== uploadPayload.mimeType) {
			return {
				success: false,
				error: "O tipo do arquivo enviado não confere com o upload autorizado.",
			};
		}

		const [attachment] = await db
			.insert(attachments)
			.values({
				userId: user.id,
				fileKey: uploadPayload.fileKey,
				fileName: uploadPayload.fileName,
				fileSize: uploadPayload.fileSize,
				mimeType: uploadPayload.mimeType,
			})
			.returning({ id: attachments.id });

		if (!attachment) {
			return { success: false, error: "Erro ao salvar o anexo." };
		}

		let transactionIds: string[] = [uploadPayload.transactionId];

		if (data.applyToSeries && transaction.seriesId) {
			const seriesRows = await db
				.select({ id: transactions.id })
				.from(transactions)
				.where(
					and(
						eq(transactions.seriesId, transaction.seriesId),
						eq(transactions.userId, user.id),
					),
				);
			transactionIds = seriesRows.map((t) => t.id);
		}

		await db.insert(transactionAttachments).values(
			transactionIds.map((tid) => ({
				transactionId: tid,
				attachmentId: attachment.id,
			})),
		);

		revalidateForEntity("transactions", user.id);

		return { success: true, message: "Anexo salvo com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function detachTransactionAttachmentAction(input: {
	attachmentId: string;
	transactionId: string;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = detachSchema.parse(input);

		const [transaction] = await db
			.select({ id: transactions.id })
			.from(transactions)
			.where(
				and(
					eq(transactions.id, data.transactionId),
					eq(transactions.userId, user.id),
				),
			);

		if (!transaction) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		const [attachment] = await db
			.select({ id: attachments.id, fileKey: attachments.fileKey })
			.from(attachments)
			.where(
				and(
					eq(attachments.id, data.attachmentId),
					eq(attachments.userId, user.id),
				),
			);

		if (!attachment) {
			return { success: false, error: "Anexo não encontrado." };
		}

		await db
			.delete(transactionAttachments)
			.where(
				and(
					eq(transactionAttachments.transactionId, data.transactionId),
					eq(transactionAttachments.attachmentId, data.attachmentId),
				),
			);

		const [remaining] = await db
			.select({ total: count() })
			.from(transactionAttachments)
			.where(eq(transactionAttachments.attachmentId, data.attachmentId));

		if (!remaining || remaining.total === 0) {
			await deleteS3Object(attachment.fileKey);
			await db.delete(attachments).where(eq(attachments.id, data.attachmentId));
		}

		revalidateForEntity("transactions", user.id);

		return { success: true, message: "Anexo removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function fetchTransactionAttachmentsAction(
	transactionId: string,
): Promise<
	Array<{
		attachmentId: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
		createdAt: Date;
		url: string;
	}>
> {
	const user = await getUser();

	const [transaction] = await db
		.select({ id: transactions.id })
		.from(transactions)
		.where(
			and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)),
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
				eq(transactions.userId, user.id),
			),
		)
		.innerJoin(
			attachments,
			and(
				eq(transactionAttachments.attachmentId, attachments.id),
				eq(attachments.userId, user.id),
			),
		)
		.where(eq(transactionAttachments.transactionId, transactionId));

	return Promise.all(
		rows.map(async (row) => ({
			attachmentId: row.attachmentId,
			fileName: row.fileName,
			fileSize: row.fileSize,
			mimeType: row.mimeType,
			createdAt: row.createdAt,
			url: await createPresignedGetUrl(row.fileKey),
		})),
	);
}

/** Limpa anexos órfãos do S3 após deletar transações. Chame APÓS o delete. */
export async function cleanupAttachmentsAfterTransactionDelete(
	attachmentData: Array<{ id: string; fileKey: string }>,
): Promise<void> {
	if (attachmentData.length === 0) return;

	const uniqueIds = [...new Set(attachmentData.map((a) => a.id))];

	const remaining = await db
		.select({
			attachmentId: transactionAttachments.attachmentId,
			total: count(),
		})
		.from(transactionAttachments)
		.where(inArray(transactionAttachments.attachmentId, uniqueIds))
		.groupBy(transactionAttachments.attachmentId);

	const remainingMap = new Map(remaining.map((r) => [r.attachmentId, r.total]));

	for (const att of attachmentData) {
		if (!remainingMap.has(att.id) || (remainingMap.get(att.id) ?? 0) === 0) {
			await deleteS3Object(att.fileKey);
			await db.delete(attachments).where(eq(attachments.id, att.id));
		}
	}
}
