"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { payerShares, payers, user } from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	DEFAULT_PAYER_AVATAR,
	PAYER_ROLE_ADMIN,
	PAYER_ROLE_THIRD_PARTY,
	PAYER_STATUS_OPTIONS,
} from "@/shared/lib/payers/constants";
import { normalizeAvatarPath } from "@/shared/lib/payers/utils";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import type { ActionResult } from "@/shared/lib/types/actions";
import { normalizeOptionalString } from "@/shared/utils/string";

const statusEnum = z
	.enum([...PAYER_STATUS_OPTIONS] as [string, ...string[]])
	.refine(
		(v) =>
			PAYER_STATUS_OPTIONS.includes(v as (typeof PAYER_STATUS_OPTIONS)[number]),
		{
			message: "Selecione um status válido.",
		},
	);

const baseSchema = z.object({
	name: z
		.string({ message: "Informe o nome do pagador." })
		.trim()
		.min(1, "Informe o nome do pagador."),
	email: z
		.string()
		.trim()
		.email("Informe um e-mail válido.")
		.nullish()
		.transform((value) => normalizeOptionalString(value)),
	status: statusEnum,
	note: noteSchema,
	avatarUrl: z.string().trim().optional(),
	isAutoSend: z.boolean().optional().default(false),
});

const createSchema = baseSchema;

const updateSchema = baseSchema.extend({
	id: uuidSchema("Payer"),
});

const deleteSchema = z.object({
	id: uuidSchema("Payer"),
});

const shareDeleteSchema = z.object({
	shareId: uuidSchema("Compartilhamento"),
});

const shareCodeJoinSchema = z.object({
	code: z
		.string({ message: "Informe o código." })
		.trim()
		.min(8, "Código inválido."),
});

const shareCodeRegenerateSchema = z.object({
	payerId: uuidSchema("Payer"),
});

type CreateInput = z.infer<typeof createSchema>;
type UpdateInput = z.infer<typeof updateSchema>;
type DeleteInput = z.infer<typeof deleteSchema>;
type ShareDeleteInput = z.infer<typeof shareDeleteSchema>;
type ShareCodeJoinInput = z.infer<typeof shareCodeJoinSchema>;
type ShareCodeRegenerateInput = z.infer<typeof shareCodeRegenerateSchema>;

const revalidate = (userId: string) => revalidateForEntity("payers", userId);

const generateShareCode = () => {
	// base64url já retorna apenas [a-zA-Z0-9_-]
	// 18 bytes = 24 caracteres em base64
	return randomBytes(18).toString("base64url").slice(0, 24);
};

export async function createPayerAction(
	input: CreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createSchema.parse(input);

		await db.insert(payers).values({
			name: data.name,
			email: data.email,
			status: data.status,
			note: data.note,
			avatarUrl: normalizeAvatarPath(data.avatarUrl) ?? DEFAULT_PAYER_AVATAR,
			isAutoSend: data.isAutoSend ?? false,
			role: PAYER_ROLE_THIRD_PARTY,
			shareCode: generateShareCode(),
			userId: user.id,
		});

		revalidate(user.id);

		return { success: true, message: "Payer criado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updatePayerAction(
	input: UpdateInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = updateSchema.parse(input);

		const existing = await db.query.payers.findFirst({
			where: and(eq(payers.id, data.id), eq(payers.userId, currentUser.id)),
		});

		if (!existing) {
			return {
				success: false,
				error: "Pagador não encontrado.",
			};
		}

		await db
			.update(payers)
			.set({
				name: data.name,
				email: data.email,
				status: data.status,
				note: data.note,
				avatarUrl:
					normalizeAvatarPath(data.avatarUrl) ?? existing.avatarUrl ?? null,
				isAutoSend: data.isAutoSend ?? false,
				role: existing.role ?? PAYER_ROLE_THIRD_PARTY,
			})
			.where(and(eq(payers.id, data.id), eq(payers.userId, currentUser.id)));

		// Se o pagador é admin, sincronizar nome com o usuário
		if (existing.role === PAYER_ROLE_ADMIN) {
			await db
				.update(user)
				.set({ name: data.name })
				.where(eq(user.id, currentUser.id));

			revalidatePath("/", "layout");
		}

		revalidate(currentUser.id);

		return { success: true, message: "Payer atualizado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deletePayerAction(
	input: DeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteSchema.parse(input);

		const existing = await db.query.payers.findFirst({
			where: and(eq(payers.id, data.id), eq(payers.userId, user.id)),
		});

		if (!existing) {
			return {
				success: false,
				error: "Pagador não encontrado.",
			};
		}

		if (existing.role === PAYER_ROLE_ADMIN) {
			return {
				success: false,
				error: "Pagadores administradores não podem ser removidos.",
			};
		}

		await db
			.delete(payers)
			.where(and(eq(payers.id, data.id), eq(payers.userId, user.id)));

		revalidate(user.id);

		return { success: true, message: "Payer removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function joinPayerByShareCodeAction(
	input: ShareCodeJoinInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = shareCodeJoinSchema.parse(input);

		const pagadorRow = await db.query.payers.findFirst({
			where: eq(payers.shareCode, data.code),
		});

		if (!pagadorRow) {
			return { success: false, error: "Código inválido ou expirado." };
		}

		if (pagadorRow.userId === user.id) {
			return {
				success: false,
				error: "Você já é o proprietário deste pagador.",
			};
		}

		const existingShare = await db.query.payerShares.findFirst({
			where: and(
				eq(payerShares.payerId, pagadorRow.id),
				eq(payerShares.sharedWithUserId, user.id),
			),
		});

		if (existingShare) {
			return {
				success: false,
				error: "Você já possui acesso a este pagador.",
			};
		}

		await db.insert(payerShares).values({
			payerId: pagadorRow.id,
			sharedWithUserId: user.id,
			permission: "read",
			createdByUserId: pagadorRow.userId,
		});

		revalidate(user.id);

		return { success: true, message: "Payer adicionado à sua lista." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deletePayerShareAction(
	input: ShareDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = shareDeleteSchema.parse(input);

		const existing = await db.query.payerShares.findFirst({
			columns: {
				id: true,
				payerId: true,
				sharedWithUserId: true,
			},
			where: eq(payerShares.id, data.shareId),
			with: {
				payer: {
					columns: {
						userId: true,
					},
				},
			},
		});

		// Permitir que o owner OU o próprio usuário compartilhado remova o share
		const payerOwner = existing?.payer as { userId: string } | null | undefined;
		if (
			!existing ||
			(payerOwner?.userId !== user.id && existing.sharedWithUserId !== user.id)
		) {
			return {
				success: false,
				error: "Compartilhamento não encontrado.",
			};
		}

		await db.delete(payerShares).where(eq(payerShares.id, data.shareId));

		revalidate(user.id);
		revalidatePath(`/payers/${existing.payerId}`);

		return { success: true, message: "Compartilhamento removido." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function regeneratePayerShareCodeAction(
	input: ShareCodeRegenerateInput,
): Promise<{ success: true; message: string; code: string } | ActionResult> {
	try {
		const user = await getUser();
		const data = shareCodeRegenerateSchema.parse(input);

		const existing = await db.query.payers.findFirst({
			columns: { id: true, userId: true },
			where: and(eq(payers.id, data.payerId), eq(payers.userId, user.id)),
		});

		if (!existing) {
			return { success: false, error: "Payer não encontrado." };
		}

		let attempts = 0;
		while (attempts < 5) {
			const newCode = generateShareCode();
			try {
				await db
					.update(payers)
					.set({ shareCode: newCode })
					.where(and(eq(payers.id, data.payerId), eq(payers.userId, user.id)));

				revalidate(user.id);
				revalidatePath(`/payers/${data.payerId}`);
				return {
					success: true,
					message: "Código atualizado com sucesso.",
					code: newCode,
				};
			} catch (error) {
				if (
					error instanceof Error &&
					"constraint" in error &&
					(error as { constraint?: string }).constraint ===
						"pagadores_share_code_key"
				) {
					attempts += 1;
					continue;
				}
				throw error;
			}
		}

		return {
			success: false,
			error: "Não foi possível gerar um código único. Tente novamente.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}
