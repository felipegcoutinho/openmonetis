"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { preLancamentos } from "@/db/schema";
import { handleActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

const markProcessedSchema = z.object({
	inboxItemId: z.string().uuid("ID do item inválido"),
});

const discardInboxSchema = z.object({
	inboxItemId: z.string().uuid("ID do item inválido"),
});

const bulkDiscardSchema = z.object({
	inboxItemIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um item"),
});

const deleteInboxSchema = z.object({
	inboxItemId: z.string().uuid("ID do item inválido"),
});

const bulkDeleteInboxSchema = z.object({
	status: z.enum(["processed", "discarded"]),
});

function revalidateInbox() {
	revalidatePath("/pre-lancamentos");
	revalidatePath("/lancamentos");
	revalidatePath("/dashboard");
}

/**
 * Mark an inbox item as processed after a lancamento was created
 */
export async function markInboxAsProcessedAction(
	input: z.infer<typeof markProcessedSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = markProcessedSchema.parse(input);

		// Verificar se item existe e pertence ao usuário
		const [item] = await db
			.select()
			.from(preLancamentos)
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
					eq(preLancamentos.status, "pending"),
				),
			)
			.limit(1);

		if (!item) {
			return { success: false, error: "Item não encontrado ou já processado." };
		}

		// Marcar item como processado
		await db
			.update(preLancamentos)
			.set({
				status: "processed",
				processedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
				),
			);

		revalidateInbox();

		return { success: true, message: "Item processado com sucesso!" };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function discardInboxItemAction(
	input: z.infer<typeof discardInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = discardInboxSchema.parse(input);

		// Verificar se item existe e pertence ao usuário
		const [item] = await db
			.select()
			.from(preLancamentos)
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
					eq(preLancamentos.status, "pending"),
				),
			)
			.limit(1);

		if (!item) {
			return { success: false, error: "Item não encontrado ou já processado." };
		}

		// Marcar item como descartado
		await db
			.update(preLancamentos)
			.set({
				status: "discarded",
				discardedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
				),
			);

		revalidateInbox();

		return { success: true, message: "Item descartado." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function bulkDiscardInboxItemsAction(
	input: z.infer<typeof bulkDiscardSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = bulkDiscardSchema.parse(input);

		// Marcar todos os itens como descartados
		await db
			.update(preLancamentos)
			.set({
				status: "discarded",
				discardedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					inArray(preLancamentos.id, data.inboxItemIds),
					eq(preLancamentos.userId, user.id),
					eq(preLancamentos.status, "pending"),
				),
			);

		revalidateInbox();

		return {
			success: true,
			message: `${data.inboxItemIds.length} item(s) descartado(s).`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteInboxItemAction(
	input: z.infer<typeof deleteInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteInboxSchema.parse(input);

		const [item] = await db
			.select({ status: preLancamentos.status })
			.from(preLancamentos)
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
				),
			)
			.limit(1);

		if (!item) {
			return { success: false, error: "Item não encontrado." };
		}

		if (item.status === "pending") {
			return {
				success: false,
				error: "Não é possível excluir itens pendentes.",
			};
		}

		await db
			.delete(preLancamentos)
			.where(
				and(
					eq(preLancamentos.id, data.inboxItemId),
					eq(preLancamentos.userId, user.id),
				),
			);

		revalidateInbox();

		return { success: true, message: "Item excluído." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function bulkDeleteInboxItemsAction(
	input: z.infer<typeof bulkDeleteInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = bulkDeleteInboxSchema.parse(input);

		const result = await db
			.delete(preLancamentos)
			.where(
				and(
					eq(preLancamentos.userId, user.id),
					eq(preLancamentos.status, data.status),
				),
			)
			.returning({ id: preLancamentos.id });

		revalidateInbox();

		const count = result.length;
		return {
			success: true,
			message: `${count} item(s) excluído(s).`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}
