import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export type { ActionResult } from "@/shared/lib/types/actions";

import type { ActionResult } from "@/shared/lib/types/actions";
import { errorResult } from "@/shared/lib/types/actions";

/**
 * Handles errors in server actions consistently
 * @param error - The error to handle
 * @returns ActionResult with error message
 */
export function handleActionError(error: unknown): ActionResult {
	if (error instanceof z.ZodError) {
		return errorResult(error.issues[0]?.message ?? "Dados inválidos.");
	}

	console.error("[ActionError]", error);
	return errorResult("Ocorreu um erro inesperado. Tente novamente.");
}

/**
 * Configuration for revalidation after mutations
 */
export const revalidateConfig = {
	cartoes: ["/cards", "/accounts", "/transactions"],
	contas: ["/accounts", "/transactions"],
	categorias: ["/categories"],
	estabelecimentos: ["/reports/establishments", "/transactions"],
	orcamentos: ["/budgets"],
	pagadores: ["/payers"],
	anotacoes: ["/notes", "/notes/arquivadas", "/dashboard"],
	lancamentos: ["/transactions", "/accounts"],
	inbox: ["/inbox", "/transactions", "/dashboard"],
	recorrentes: ["/transactions", "/dashboard"],
} as const;

/** Entities whose mutations should invalidate the dashboard cache */
const DASHBOARD_ENTITIES: ReadonlySet<string> = new Set([
	"lancamentos",
	"contas",
	"cartoes",
	"orcamentos",
	"pagadores",
	"anotacoes",
	"inbox",
	"recorrentes",
]);

/**
 * Revalidates paths for a specific entity.
 * Also invalidates the dashboard "use cache" tag for financial entities.
 * @param entity - The entity type
 */
export function revalidateForEntity(
	entity: keyof typeof revalidateConfig,
): void {
	revalidateConfig[entity].forEach((path) => revalidatePath(path));

	// Invalidate dashboard cache for financial mutations
	if (DASHBOARD_ENTITIES.has(entity)) {
		revalidateTag("dashboard", "max");
	}
}
