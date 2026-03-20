"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { budgets, categories } from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { periodSchema, uuidSchema } from "@/shared/lib/schemas/common";
import type { ActionResult } from "@/shared/lib/types/actions";
import {
	formatDecimalForDbRequired,
	normalizeDecimalInput,
} from "@/shared/utils/currency";
import { getPreviousPeriod } from "@/shared/utils/period";

const budgetBaseSchema = z.object({
	categoryId: uuidSchema("Category"),
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

type BudgetCreateInput = z.input<typeof createBudgetSchema>;
type BudgetUpdateInput = z.input<typeof updateBudgetSchema>;
type BudgetDeleteInput = z.input<typeof deleteBudgetSchema>;
type BudgetCopyRow = {
	categoryId: string | null;
	amount: unknown;
};

const BUDGET_DUPLICATE_ERROR =
	"Já existe um orçamento para esta categoria no período selecionado.";
const BUDGET_UNIQUE_CONSTRAINT = "orcamentos_user_id_categoria_id_periodo_key";

const hasUniqueConstraintError = (error: unknown, constraint: string) => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const candidate = error as {
		code?: string;
		constraint?: string;
		cause?: { code?: string; constraint?: string };
	};

	return (
		(candidate.code === "23505" && candidate.constraint === constraint) ||
		(candidate.cause?.code === "23505" &&
			candidate.cause.constraint === constraint)
	);
};

const ensureCategory = async (userId: string, categoryId: string) => {
	const category = await db.query.categories.findFirst({
		columns: {
			id: true,
			type: true,
		},
		where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
	});

	if (!category) {
		throw new Error("Category não encontrada.");
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

		await ensureCategory(user.id, data.categoryId);

		const [createdBudget] = await db
			.insert(budgets)
			.values({
				amount: formatDecimalForDbRequired(data.amount),
				period: data.period,
				userId: user.id,
				categoryId: data.categoryId,
			})
			.onConflictDoNothing({
				target: [budgets.userId, budgets.categoryId, budgets.period],
			})
			.returning({ id: budgets.id });

		if (!createdBudget) {
			return {
				success: false,
				error: BUDGET_DUPLICATE_ERROR,
			};
		}

		revalidateForEntity("budgets", user.id);

		return { success: true, message: "Orçamento criado com sucesso." };
	} catch (error) {
		if (hasUniqueConstraintError(error, BUDGET_UNIQUE_CONSTRAINT)) {
			return {
				success: false,
				error: BUDGET_DUPLICATE_ERROR,
			};
		}

		return handleActionError(error);
	}
}

export async function updateBudgetAction(
	input: BudgetUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateBudgetSchema.parse(input);

		await ensureCategory(user.id, data.categoryId);

		const [updated] = await db
			.update(budgets)
			.set({
				amount: formatDecimalForDbRequired(data.amount),
				period: data.period,
				categoryId: data.categoryId,
			})
			.where(and(eq(budgets.id, data.id), eq(budgets.userId, user.id)))
			.returning({ id: budgets.id });

		if (!updated) {
			return {
				success: false,
				error: "Orçamento não encontrado.",
			};
		}

		revalidateForEntity("budgets", user.id);

		return { success: true, message: "Orçamento atualizado com sucesso." };
	} catch (error) {
		if (hasUniqueConstraintError(error, BUDGET_UNIQUE_CONSTRAINT)) {
			return {
				success: false,
				error: BUDGET_DUPLICATE_ERROR,
			};
		}

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
			.delete(budgets)
			.where(and(eq(budgets.id, data.id), eq(budgets.userId, user.id)))
			.returning({ id: budgets.id });

		if (!deleted) {
			return {
				success: false,
				error: "Orçamento não encontrado.",
			};
		}

		revalidateForEntity("budgets", user.id);

		return { success: true, message: "Orçamento removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

const duplicatePreviousMonthSchema = z.object({
	period: periodSchema,
});

type DuplicatePreviousMonthInput = z.input<typeof duplicatePreviousMonthSchema>;

export async function duplicatePreviousMonthBudgetsAction(
	input: DuplicatePreviousMonthInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = duplicatePreviousMonthSchema.parse(input);

		// Calcular mês anterior
		const previousPeriod = getPreviousPeriod(data.period);

		// Buscar orçamentos do mês anterior
		const previousBudgets = (await db.query.budgets.findMany({
			where: and(
				eq(budgets.userId, user.id),
				eq(budgets.period, previousPeriod),
			),
		})) as BudgetCopyRow[];

		if (previousBudgets.length === 0) {
			return {
				success: false,
				error: "Não foram encontrados orçamentos no mês anterior.",
			};
		}

		// Buscar orçamentos existentes do mês atual
		const currentBudgets = (await db.query.budgets.findMany({
			where: and(eq(budgets.userId, user.id), eq(budgets.period, data.period)),
		})) as BudgetCopyRow[];

		// Filtrar para evitar duplicatas
		const existingCategoryIds = new Set(
			currentBudgets.map((b) => b.categoryId),
		);

		const budgetsToCopy = previousBudgets.filter(
			(b) => b.categoryId && !existingCategoryIds.has(b.categoryId),
		);

		if (budgetsToCopy.length === 0) {
			return {
				success: false,
				error:
					"Todas as categories do mês anterior já possuem orçamento neste mês.",
			};
		}

		// Inserir novos orçamentos sem falhar se houver corrida com outro request.
		const insertedBudgets = await db
			.insert(budgets)
			.values(
				budgetsToCopy.map((b) => ({
					amount: b.amount as string,
					period: data.period,
					userId: user.id,
					categoryId: b.categoryId as string,
				})),
			)
			.onConflictDoNothing({
				target: [budgets.userId, budgets.categoryId, budgets.period],
			})
			.returning({ id: budgets.id });

		if (insertedBudgets.length === 0) {
			return {
				success: false,
				error:
					"Todas as categories do mês anterior já possuem orçamento neste mês.",
			};
		}

		revalidateForEntity("budgets", user.id);

		return {
			success: true,
			message: `${insertedBudgets.length} orçamento${insertedBudgets.length > 1 ? "s" : ""} duplicado${insertedBudgets.length > 1 ? "s" : ""} com sucesso.`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}
