"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { categories } from "@/db/schema";
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
	id: uuidSchema("Category"),
});
const deleteCategorySchema = z.object({
	id: uuidSchema("Category"),
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

		await db.insert(categories).values({
			name: data.name,
			type: data.type,
			icon: data.icon,
			userId: user.id,
		});

		revalidateForEntity("categories", user.id);

		return { success: true, message: "Category criada com sucesso." };
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
		const categoria = await db.query.categories.findFirst({
			columns: { id: true, name: true },
			where: and(eq(categories.id, data.id), eq(categories.userId, user.id)),
		});

		if (!categoria) {
			return {
				success: false,
				error: "Category não encontrada.",
			};
		}

		// Bloquear edição das categories protegidas
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
			.update(categories)
			.set({
				name: data.name,
				type: data.type,
				icon: data.icon,
			})
			.where(and(eq(categories.id, data.id), eq(categories.userId, user.id)))
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Category não encontrada.",
			};
		}

		revalidateForEntity("categories", user.id);

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
		const categoria = await db.query.categories.findFirst({
			columns: { id: true, name: true },
			where: and(eq(categories.id, data.id), eq(categories.userId, user.id)),
		});

		if (!categoria) {
			return {
				success: false,
				error: "Category não encontrada.",
			};
		}

		// Bloquear remoção das categories protegidas
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
			.delete(categories)
			.where(and(eq(categories.id, data.id), eq(categories.userId, user.id)))
			.returning({ id: categories.id });

		if (!deleted) {
			return {
				success: false,
				error: "Category não encontrada.",
			};
		}

		revalidateForEntity("categories", user.id);

		return { success: true, message: "Category removida com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}
