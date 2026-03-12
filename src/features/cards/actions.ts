"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { cartoes, contas } from "@/db/schema";
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
	contaId: uuidSchema("Conta"),
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

async function assertAccountOwnership(userId: string, contaId: string) {
	const account = await db.query.contas.findFirst({
		columns: { id: true },
		where: and(eq(contas.id, contaId), eq(contas.userId, userId)),
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

		await assertAccountOwnership(user.id, data.contaId);

		const logoFile = normalizeFilePath(data.logo);

		await db.insert(cartoes).values({
			name: data.name,
			brand: data.brand,
			status: data.status,
			closingDay: data.closingDay,
			dueDay: data.dueDay,
			note: data.note ?? null,
			limit: formatDecimalForDb(data.limit),
			logo: logoFile,
			contaId: data.contaId,
			userId: user.id,
		});

		revalidateForEntity("cartoes");

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

		await assertAccountOwnership(user.id, data.contaId);

		const logoFile = normalizeFilePath(data.logo);

		const [updated] = await db
			.update(cartoes)
			.set({
				name: data.name,
				brand: data.brand,
				status: data.status,
				closingDay: data.closingDay,
				dueDay: data.dueDay,
				note: data.note ?? null,
				limit: formatDecimalForDb(data.limit),
				logo: logoFile,
				contaId: data.contaId,
			})
			.where(and(eq(cartoes.id, data.id), eq(cartoes.userId, user.id)))
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Cartão não encontrado.",
			};
		}

		revalidateForEntity("cartoes");

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
			.delete(cartoes)
			.where(and(eq(cartoes.id, data.id), eq(cartoes.userId, user.id)))
			.returning({ id: cartoes.id });

		if (!deleted) {
			return {
				success: false,
				error: "Cartão não encontrado.",
			};
		}

		revalidateForEntity("cartoes");

		return { success: true, message: "Cartão removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}
