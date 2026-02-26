"use server";

import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { categorias, orcamentos } from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/lib/actions/helpers";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { periodSchema, uuidSchema } from "@/lib/schemas/common";
import {
	formatDecimalForDbRequired,
	normalizeDecimalInput,
} from "@/lib/utils/currency";

const budgetBaseSchema = z.object({
	categoriaId: uuidSchema("Categoria"),
	period: periodSchema,
	amount: z
		.string({ message: "Informe o valor limite." })
		.trim()
		.min(1, "Informe o valor limite.")
		.transform((value) => normalizeDecimalInput(value))
		.refine(
			(value) => !Number.isNaN(Number.parseFloat(value)),
			"Informe um valor limite válido.",
		)
		.transform((value) => Number.parseFloat(value))
		.refine(
			(value) => value >= 0,
			"O valor limite deve ser maior ou igual a zero.",
		),
});

const createBudgetSchema = budgetBaseSchema;
const updateBudgetSchema = budgetBaseSchema.extend({
	id: uuidSchema("Orçamento"),
});
const deleteBudgetSchema = z.object({
	id: uuidSchema("Orçamento"),
});

type BudgetCreateInput = z.infer<typeof createBudgetSchema>;
type BudgetUpdateInput = z.infer<typeof updateBudgetSchema>;
type BudgetDeleteInput = z.infer<typeof deleteBudgetSchema>;

const ensureCategory = async (userId: string, categoriaId: string) => {
	const category = await db.query.categorias.findFirst({
		columns: {
			id: true,
			type: true,
		},
		where: and(eq(categorias.id, categoriaId), eq(categorias.userId, userId)),
	});

	if (!category) {
		throw new Error("Categoria não encontrada.");
	}

	if (category.type !== "despesa") {
		throw new Error("Selecione uma categoria de despesa.");
	}
};

export async function createBudgetAction(
	input: BudgetCreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createBudgetSchema.parse(input);

		await ensureCategory(user.id, data.categoriaId);

		const duplicateConditions = [
			eq(orcamentos.userId, user.id),
			eq(orcamentos.period, data.period),
			eq(orcamentos.categoriaId, data.categoriaId),
		] as const;

		const duplicate = await db.query.orcamentos.findFirst({
			columns: { id: true },
			where: and(...duplicateConditions),
		});

		if (duplicate) {
			return {
				success: false,
				error:
					"Já existe um orçamento para esta categoria no período selecionado.",
			};
		}

		await db.insert(orcamentos).values({
			amount: formatDecimalForDbRequired(data.amount),
			period: data.period,
			userId: user.id,
			categoriaId: data.categoriaId,
		});

		revalidateForEntity("orcamentos");

		return { success: true, message: "Orçamento criado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateBudgetAction(
	input: BudgetUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateBudgetSchema.parse(input);

		await ensureCategory(user.id, data.categoriaId);

		const duplicateConditions = [
			eq(orcamentos.userId, user.id),
			eq(orcamentos.period, data.period),
			eq(orcamentos.categoriaId, data.categoriaId),
			ne(orcamentos.id, data.id),
		] as const;

		const duplicate = await db.query.orcamentos.findFirst({
			columns: { id: true },
			where: and(...duplicateConditions),
		});

		if (duplicate) {
			return {
				success: false,
				error:
					"Já existe um orçamento para esta categoria no período selecionado.",
			};
		}

		const [updated] = await db
			.update(orcamentos)
			.set({
				amount: formatDecimalForDbRequired(data.amount),
				period: data.period,
				categoriaId: data.categoriaId,
			})
			.where(and(eq(orcamentos.id, data.id), eq(orcamentos.userId, user.id)))
			.returning({ id: orcamentos.id });

		if (!updated) {
			return {
				success: false,
				error: "Orçamento não encontrado.",
			};
		}

		revalidateForEntity("orcamentos");

		return { success: true, message: "Orçamento atualizado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteBudgetAction(
	input: BudgetDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteBudgetSchema.parse(input);

		const [deleted] = await db
			.delete(orcamentos)
			.where(and(eq(orcamentos.id, data.id), eq(orcamentos.userId, user.id)))
			.returning({ id: orcamentos.id });

		if (!deleted) {
			return {
				success: false,
				error: "Orçamento não encontrado.",
			};
		}

		revalidateForEntity("orcamentos");

		return { success: true, message: "Orçamento removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

const duplicatePreviousMonthSchema = z.object({
	period: periodSchema,
});

type DuplicatePreviousMonthInput = z.infer<typeof duplicatePreviousMonthSchema>;

export async function duplicatePreviousMonthBudgetsAction(
	input: DuplicatePreviousMonthInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = duplicatePreviousMonthSchema.parse(input);

		// Calcular mês anterior
		const [year, month] = data.period.split("-").map(Number);
		const currentDate = new Date(year, month - 1, 1);
		const previousDate = new Date(currentDate);
		previousDate.setMonth(previousDate.getMonth() - 1);

		const prevYear = previousDate.getFullYear();
		const prevMonth = String(previousDate.getMonth() + 1).padStart(2, "0");
		const previousPeriod = `${prevYear}-${prevMonth}`;

		// Buscar orçamentos do mês anterior
		const previousBudgets = await db.query.orcamentos.findMany({
			where: and(
				eq(orcamentos.userId, user.id),
				eq(orcamentos.period, previousPeriod),
			),
		});

		if (previousBudgets.length === 0) {
			return {
				success: false,
				error: "Não foram encontrados orçamentos no mês anterior.",
			};
		}

		// Buscar orçamentos existentes do mês atual
		const currentBudgets = await db.query.orcamentos.findMany({
			where: and(
				eq(orcamentos.userId, user.id),
				eq(orcamentos.period, data.period),
			),
		});

		// Filtrar para evitar duplicatas
		const existingCategoryIds = new Set(
			currentBudgets.map((b) => b.categoriaId),
		);

		const budgetsToCopy = previousBudgets.filter(
			(b) => b.categoriaId && !existingCategoryIds.has(b.categoriaId),
		);

		if (budgetsToCopy.length === 0) {
			return {
				success: false,
				error:
					"Todas as categorias do mês anterior já possuem orçamento neste mês.",
			};
		}

		// Inserir novos orçamentos
		await db.insert(orcamentos).values(
			budgetsToCopy.map((b) => ({
				amount: b.amount,
				period: data.period,
				userId: user.id,
				categoriaId: b.categoriaId as string,
			})),
		);

		revalidateForEntity("orcamentos");

		return {
			success: true,
			message: `${budgetsToCopy.length} orçamento${budgetsToCopy.length > 1 ? "s" : ""} duplicado${budgetsToCopy.length > 1 ? "s" : ""} com sucesso.`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}
