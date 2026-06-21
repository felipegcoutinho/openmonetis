"use server";

import crypto, { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
	attachments,
	noteAttachments,
	notes,
	userPreferences,
} from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import {
	ALLOWED_MIME_TYPES,
	ATTACHMENT_SIZE_OPTIONS,
} from "@/shared/lib/attachments/config";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	createPresignedPutUrl,
	deleteS3Object,
	headS3Object,
} from "@/shared/lib/storage/presign";
import type { ActionResult } from "@/shared/lib/types/actions";

const UPLOAD_TOKEN_EXPIRY_SECONDS = 10 * 60;
const MAX_NOTE_FILE_SIZE = Math.max(...ATTACHMENT_SIZE_OPTIONS) * 1024 * 1024;

const presignSchema = z.object({
	noteId: z.string().uuid(),
	fileName: z.string().min(1).max(255),
	mimeType: z.enum(ALLOWED_MIME_TYPES),
	fileSize: z.number().positive().max(MAX_NOTE_FILE_SIZE),
});

const tokenPayloadSchema = presignSchema.extend({
	userId: z.string().min(1),
	fileKey: z.string().min(1),
	exp: z.number().int(),
});

type UploadTokenPayload = z.infer<typeof tokenPayloadSchema>;

type PresignResult =
	| { success: true; presignedUrl: string; uploadToken: string }
	| { success: false; error: string };

export type NoteAttachmentData = {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
};

function getUploadTokenSecret(): string {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) throw new Error("BETTER_AUTH_SECRET is required.");
	return secret;
}

function encode(value: string): string {
	return Buffer.from(value).toString("base64url");
}

function signUploadToken(payload: UploadTokenPayload): string {
	const encoded = encode(JSON.stringify(payload));
	const signature = crypto
		.createHmac("sha256", getUploadTokenSecret())
		.update(encoded)
		.digest("base64url");
	return `${encoded}.${signature}`;
}

function verifyUploadToken(token: string): UploadTokenPayload | null {
	try {
		const [encoded, signature] = token.split(".");
		if (!encoded || !signature) return null;
		const expected = crypto
			.createHmac("sha256", getUploadTokenSecret())
			.update(encoded)
			.digest("base64url");
		if (
			signature.length !== expected.length ||
			!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
		) {
			return null;
		}
		const parsed = tokenPayloadSchema.safeParse(
			JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")),
		);
		if (!parsed.success || parsed.data.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}
		if (!parsed.data.fileKey.startsWith(`${parsed.data.userId}/`)) return null;
		return parsed.data;
	} catch {
		return null;
	}
}

async function findOwnedNote(noteId: string, userId: string) {
	const [note] = await db
		.select({ id: notes.id, type: notes.type })
		.from(notes)
		.where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
	return note?.type === "nota" ? note : null;
}

async function getAttachmentLimitBytes(userId: string): Promise<number> {
	const [preferences] = await db
		.select({ maxSizeMb: userPreferences.attachmentMaxSizeMb })
		.from(userPreferences)
		.where(eq(userPreferences.userId, userId));
	return (preferences?.maxSizeMb ?? 50) * 1024 * 1024;
}

export async function getPresignedNoteAttachmentUploadUrlAction(input: {
	noteId: string;
	fileName: string;
	mimeType: string;
	fileSize: number;
}): Promise<PresignResult> {
	try {
		const user = await getUser();
		const data = presignSchema.parse(input);
		if (data.fileSize > (await getAttachmentLimitBytes(user.id))) {
			return {
				success: false,
				error: "O arquivo excede o limite configurado para anexos.",
			};
		}
		if (!(await findOwnedNote(data.noteId, user.id))) {
			return { success: false, error: "Nota não encontrada." };
		}

		const extensions: Record<(typeof ALLOWED_MIME_TYPES)[number], string> = {
			"application/pdf": "pdf",
			"image/jpeg": "jpg",
			"image/png": "png",
			"image/webp": "webp",
		};
		const extension = extensions[data.mimeType];
		const fileKey = `${user.id}/${randomUUID()}.${extension}`;
		const presignedUrl = await createPresignedPutUrl(fileKey, data.mimeType);
		const uploadToken = signUploadToken({
			...data,
			userId: user.id,
			fileKey,
			exp: Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_EXPIRY_SECONDS,
		});
		return { success: true, presignedUrl, uploadToken };
	} catch (error) {
		const result = handleActionError(error);
		return {
			success: false,
			error: result.success ? "Algo deu errado." : result.error,
		};
	}
}

export async function confirmNoteAttachmentUploadAction(input: {
	uploadToken: string;
}): Promise<ActionResult<NoteAttachmentData>> {
	try {
		const user = await getUser();
		const payload = verifyUploadToken(input.uploadToken);
		if (!payload || payload.userId !== user.id) {
			return { success: false, error: "Upload de anexo inválido ou expirado." };
		}
		if (!(await findOwnedNote(payload.noteId, user.id))) {
			return { success: false, error: "Nota não encontrada." };
		}

		const metadata = await headS3Object(payload.fileKey);
		if (
			!metadata.contentLength ||
			metadata.contentLength !== payload.fileSize ||
			metadata.contentLength > MAX_NOTE_FILE_SIZE ||
			metadata.contentType !== payload.mimeType
		) {
			return {
				success: false,
				error: "O arquivo enviado não confere com o upload autorizado.",
			};
		}

		const [attachment] = await db
			.insert(attachments)
			.values({
				userId: user.id,
				fileKey: payload.fileKey,
				fileName: payload.fileName,
				fileSize: payload.fileSize,
				mimeType: payload.mimeType,
			})
			.returning({ id: attachments.id });
		if (!attachment)
			return { success: false, error: "Não foi possível salvar o anexo." };

		await db.insert(noteAttachments).values({
			noteId: payload.noteId,
			attachmentId: attachment.id,
		});
		revalidateForEntity("notes", user.id);
		return {
			success: true,
			message: "Anexo enviado.",
			data: {
				attachmentId: attachment.id,
				fileName: payload.fileName,
				fileSize: payload.fileSize,
				mimeType: payload.mimeType,
			},
		};
	} catch (error) {
		const result = handleActionError(error);
		return {
			success: false,
			error: result.success ? "Ocorreu um erro inesperado." : result.error,
		};
	}
}

export async function removeNoteAttachmentAction(input: {
	noteId: string;
	attachmentId: string;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = z
			.object({ noteId: z.string().uuid(), attachmentId: z.string().uuid() })
			.parse(input);
		if (!(await findOwnedNote(data.noteId, user.id))) {
			return { success: false, error: "Nota não encontrada." };
		}
		const [attachment] = await db
			.select({ fileKey: attachments.fileKey })
			.from(noteAttachments)
			.innerJoin(
				attachments,
				and(
					eq(noteAttachments.attachmentId, attachments.id),
					eq(attachments.userId, user.id),
				),
			)
			.where(
				and(
					eq(noteAttachments.noteId, data.noteId),
					eq(noteAttachments.attachmentId, data.attachmentId),
				),
			);
		if (!attachment) return { success: false, error: "Anexo não encontrado." };

		await db
			.delete(noteAttachments)
			.where(
				and(
					eq(noteAttachments.noteId, data.noteId),
					eq(noteAttachments.attachmentId, data.attachmentId),
				),
			);
		await deleteS3Object(attachment.fileKey);
		await db
			.delete(attachments)
			.where(
				and(
					eq(attachments.id, data.attachmentId),
					eq(attachments.userId, user.id),
				),
			);
		revalidateForEntity("notes", user.id);
		return { success: true, message: "Anexo removido." };
	} catch (error) {
		return handleActionError(error);
	}
}
