"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { inboxItems } from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import type { ActionResult } from "@/shared/lib/types/actions";

const markProcessedSchema = z.object({
	inboxItemId: z.string().uuid("ID do item inválido"),
});

const discardInboxSchema = z.object({
	inboxItemId: z.string().uuid("ID do item inválido"),
});

const restoreDiscardedInboxSchema = z.object({
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

const bulkDeleteSelectedInboxSchema = z.object({
	inboxItemIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um item"),
});

function revalidateInbox() {
	revalidateForEntity("inbox");
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
			.from(inboxItems)
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
					eq(inboxItems.status, "pending"),
				),
			)
			.limit(1);

		if (!item) {
			return { success: false, error: "Item não encontrado ou já processado." };
		}

		// Marcar item como processado
		await db
			.update(inboxItems)
			.set({
				status: "processed",
				processedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
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
			.from(inboxItems)
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
					eq(inboxItems.status, "pending"),
				),
			)
			.limit(1);

		if (!item) {
			return { success: false, error: "Item não encontrado ou já processado." };
		}

		// Marcar item como descartado
		await db
			.update(inboxItems)
			.set({
				status: "discarded",
				discardedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
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
			.update(inboxItems)
			.set({
				status: "discarded",
				discardedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					inArray(inboxItems.id, data.inboxItemIds),
					eq(inboxItems.userId, user.id),
					eq(inboxItems.status, "pending"),
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

export async function restoreDiscardedInboxItemAction(
	input: z.infer<typeof restoreDiscardedInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = restoreDiscardedInboxSchema.parse(input);

		const [item] = await db
			.select({ id: inboxItems.id })
			.from(inboxItems)
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
					eq(inboxItems.status, "discarded"),
				),
			)
			.limit(1);

		if (!item) {
			return {
				success: false,
				error: "Item não encontrado ou não está descartado.",
			};
		}

		await db
			.update(inboxItems)
			.set({
				status: "pending",
				discardedAt: null,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
				),
			);

		revalidateInbox();

		return { success: true, message: "Item voltou para pendentes." };
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
			.select({ status: inboxItems.status })
			.from(inboxItems)
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
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
			.delete(inboxItems)
			.where(
				and(
					eq(inboxItems.id, data.inboxItemId),
					eq(inboxItems.userId, user.id),
				),
			);

		revalidateInbox();

		return { success: true, message: "Item excluído." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function bulkDeleteSelectedInboxItemsAction(
	input: z.infer<typeof bulkDeleteSelectedInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = bulkDeleteSelectedInboxSchema.parse(input);

		const result = await db
			.delete(inboxItems)
			.where(
				and(
					inArray(inboxItems.id, data.inboxItemIds),
					eq(inboxItems.userId, user.id),
					ne(inboxItems.status, "pending"),
				),
			)
			.returning({ id: inboxItems.id });

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

export async function bulkDeleteInboxItemsAction(
	input: z.infer<typeof bulkDeleteInboxSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = bulkDeleteInboxSchema.parse(input);

		const result = await db
			.delete(inboxItems)
			.where(
				and(eq(inboxItems.userId, user.id), eq(inboxItems.status, data.status)),
			)
			.returning({ id: inboxItems.id });

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
