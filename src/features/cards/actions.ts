"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { cards, financialAccounts } from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	dayOfMonthSchema,
	noteSchema,
	optionalDecimalSchema,
	uuidSchema,
} from "@/shared/lib/schemas/common";
import { formatDecimalForDb } from "@/shared/utils/currency";
import { normalizeFilePath } from "@/shared/utils/string";

const cardBaseSchema = z.object({
	name: z
		.string({ message: "Informe o nome do cartão." })
		.trim()
		.min(1, "Informe o nome do cartão."),
	brand: z
		.string({ message: "Informe a bandeira." })
		.trim()
		.min(1, "Informe a bandeira."),
	status: z
		.string({ message: "Informe o status do cartão." })
		.trim()
		.min(1, "Informe o status do cartão."),
	closingDay: dayOfMonthSchema,
	dueDay: dayOfMonthSchema,
	note: noteSchema,
	limit: optionalDecimalSchema,
	logo: z
		.string({ message: "Selecione um logo." })
		.trim()
		.min(1, "Selecione um logo."),
	accountId: uuidSchema("FinancialAccount"),
});

const createCardSchema = cardBaseSchema;
const updateCardSchema = cardBaseSchema.extend({
	id: uuidSchema("Cartão"),
});
const deleteCardSchema = z.object({
	id: uuidSchema("Cartão"),
});

type CardCreateInput = z.infer<typeof createCardSchema>;
type CardUpdateInput = z.infer<typeof updateCardSchema>;
type CardDeleteInput = z.infer<typeof deleteCardSchema>;

async function assertAccountOwnership(userId: string, accountId: string) {
	const account = await db.query.financialAccounts.findFirst({
		columns: { id: true },
		where: and(
			eq(financialAccounts.id, accountId),
			eq(financialAccounts.userId, userId),
		),
	});

	if (!account) {
		throw new Error("Conta vinculada não encontrada.");
	}
}

export async function createCardAction(
	input: CardCreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createCardSchema.parse(input);

		await assertAccountOwnership(user.id, data.accountId);

		const logoFile = normalizeFilePath(data.logo);

		await db.insert(cards).values({
			name: data.name,
			brand: data.brand,
			status: data.status,
			closingDay: data.closingDay,
			dueDay: data.dueDay,
			note: data.note ?? null,
			limit: formatDecimalForDb(data.limit),
			logo: logoFile,
			accountId: data.accountId,
			userId: user.id,
		});

		revalidateForEntity("cards", user.id);

		return { success: true, message: "Cartão criado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateCardAction(
	input: CardUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateCardSchema.parse(input);

		await assertAccountOwnership(user.id, data.accountId);

		const logoFile = normalizeFilePath(data.logo);

		const [updated] = await db
			.update(cards)
			.set({
				name: data.name,
				brand: data.brand,
				status: data.status,
				closingDay: data.closingDay,
				dueDay: data.dueDay,
				note: data.note ?? null,
				limit: formatDecimalForDb(data.limit),
				logo: logoFile,
				accountId: data.accountId,
			})
			.where(and(eq(cards.id, data.id), eq(cards.userId, user.id)))
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Cartão não encontrado.",
			};
		}

		revalidateForEntity("cards", user.id);

		return { success: true, message: "Cartão atualizado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteCardAction(
	input: CardDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteCardSchema.parse(input);

		const [deleted] = await db
			.delete(cards)
			.where(and(eq(cards.id, data.id), eq(cards.userId, user.id)))
			.returning({ id: cards.id });

		if (!deleted) {
			return {
				success: false,
				error: "Cartão não encontrado.",
			};
		}

		revalidateForEntity("cards", user.id);

		return { success: true, message: "Cartão removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}
