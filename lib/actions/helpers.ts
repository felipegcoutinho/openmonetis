import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./types";
import { errorResult } from "./types";

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
	cartoes: ["/cartoes", "/contas", "/lancamentos"],
	contas: ["/contas", "/lancamentos"],
	categorias: ["/categorias"],
	estabelecimentos: ["/estabelecimentos", "/lancamentos"],
	orcamentos: ["/orcamentos"],
	pagadores: ["/pagadores"],
	anotacoes: ["/anotacoes", "/anotacoes/arquivadas"],
	lancamentos: ["/lancamentos", "/contas"],
	inbox: ["/pre-lancamentos", "/lancamentos", "/dashboard"],
} as const;

/** Entities whose mutations should invalidate the dashboard cache */
const DASHBOARD_ENTITIES: ReadonlySet<string> = new Set([
	"lancamentos",
	"contas",
	"cartoes",
	"orcamentos",
	"pagadores",
	"inbox",
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
