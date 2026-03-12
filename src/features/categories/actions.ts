"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { categorias } from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { CATEGORY_TYPES } from "@/shared/lib/categories/constants";
import { db } from "@/shared/lib/db";
import { uuidSchema } from "@/shared/lib/schemas/common";
import { normalizeIconInput } from "@/shared/utils/string";

const categoryBaseSchema = z.object({
	name: z
		.string({ message: "Informe o nome da categoria." })
		.trim()
		.min(1, "Informe o nome da categoria."),
	type: z.enum(CATEGORY_TYPES, {
		message: "Tipo de categoria inválido.",
	}),
	icon: z
		.string()
		.trim()
		.max(100, "O ícone deve ter no máximo 100 caracteres.")
		.nullish()
		.transform((value) => normalizeIconInput(value)),
});

const createCategorySchema = categoryBaseSchema;
const updateCategorySchema = categoryBaseSchema.extend({
	id: uuidSchema("Categoria"),
});
const deleteCategorySchema = z.object({
	id: uuidSchema("Categoria"),
});

type CategoryCreateInput = z.infer<typeof createCategorySchema>;
type CategoryUpdateInput = z.infer<typeof updateCategorySchema>;
type CategoryDeleteInput = z.infer<typeof deleteCategorySchema>;

export async function createCategoryAction(
	input: CategoryCreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createCategorySchema.parse(input);

		await db.insert(categorias).values({
			name: data.name,
			type: data.type,
			icon: data.icon,
			userId: user.id,
		});

		revalidateForEntity("categorias");

		return { success: true, message: "Categoria criada com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateCategoryAction(
	input: CategoryUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateCategorySchema.parse(input);

		// Buscar categoria antes de atualizar para verificar restrições
		const categoria = await db.query.categorias.findFirst({
			columns: { id: true, name: true },
			where: and(eq(categorias.id, data.id), eq(categorias.userId, user.id)),
		});

		if (!categoria) {
			return {
				success: false,
				error: "Categoria não encontrada.",
			};
		}

		// Bloquear edição das categorias protegidas
		const categoriasProtegidas = [
			"Transferência interna",
			"Saldo inicial",
			"Pagamentos",
		];
		if (categoriasProtegidas.includes(categoria.name)) {
			return {
				success: false,
				error: `A categoria '${categoria.name}' é protegida e não pode ser editada.`,
			};
		}

		const [updated] = await db
			.update(categorias)
			.set({
				name: data.name,
				type: data.type,
				icon: data.icon,
			})
			.where(and(eq(categorias.id, data.id), eq(categorias.userId, user.id)))
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Categoria não encontrada.",
			};
		}

		revalidateForEntity("categorias");

		return { success: true, message: "Categoria atualizada com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteCategoryAction(
	input: CategoryDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteCategorySchema.parse(input);

		// Buscar categoria antes de deletar para verificar restrições
		const categoria = await db.query.categorias.findFirst({
			columns: { id: true, name: true },
			where: and(eq(categorias.id, data.id), eq(categorias.userId, user.id)),
		});

		if (!categoria) {
			return {
				success: false,
				error: "Categoria não encontrada.",
			};
		}

		// Bloquear remoção das categorias protegidas
		const categoriasProtegidas = [
			"Transferência interna",
			"Saldo inicial",
			"Pagamentos",
		];
		if (categoriasProtegidas.includes(categoria.name)) {
			return {
				success: false,
				error: `A categoria '${categoria.name}' é protegida e não pode ser removida.`,
			};
		}

		const [deleted] = await db
			.delete(categorias)
			.where(and(eq(categorias.id, data.id), eq(categorias.userId, user.id)))
			.returning({ id: categorias.id });

		if (!deleted) {
			return {
				success: false,
				error: "Categoria não encontrada.",
			};
		}

		revalidateForEntity("categorias");

		return { success: true, message: "Categoria removida com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}
