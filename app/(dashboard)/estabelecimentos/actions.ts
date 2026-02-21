"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { estabelecimentos, lancamentos } from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/lib/actions/helpers";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { uuidSchema } from "@/lib/schemas/common";

const createSchema = z.object({
	name: z
		.string({ message: "Informe o nome do estabelecimento." })
		.trim()
		.min(1, "Informe o nome do estabelecimento."),
});

const deleteSchema = z.object({
	id: uuidSchema("Estabelecimento"),
});

export async function createEstabelecimentoAction(
	input: z.infer<typeof createSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createSchema.parse(input);

		await db.insert(estabelecimentos).values({
			name: data.name,
			userId: user.id,
		});

		revalidateForEntity("estabelecimentos");

		return { success: true, message: "Estabelecimento criado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteEstabelecimentoAction(
	input: z.infer<typeof deleteSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteSchema.parse(input);

		const row = await db.query.estabelecimentos.findFirst({
			columns: { id: true, name: true },
			where: and(
				eq(estabelecimentos.id, data.id),
				eq(estabelecimentos.userId, user.id),
			),
		});

		if (!row) {
			return {
				success: false,
				error: "Estabelecimento não encontrado.",
			};
		}

		const [linked] = await db
			.select({ id: lancamentos.id })
			.from(lancamentos)
			.where(
				and(
					eq(lancamentos.userId, user.id),
					eq(lancamentos.name, row.name),
				),
			)
			.limit(1);

		if (linked) {
			return {
				success: false,
				error:
					"Não é possível excluir: existem lançamentos vinculados a este estabelecimento. Remova ou altere os lançamentos primeiro.",
			};
		}

		await db
			.delete(estabelecimentos)
			.where(
				and(
					eq(estabelecimentos.id, data.id),
					eq(estabelecimentos.userId, user.id),
				),
			);

		revalidateForEntity("estabelecimentos");

		return { success: true, message: "Estabelecimento excluído com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}
