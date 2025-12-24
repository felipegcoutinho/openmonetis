import { getUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
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

  if (error instanceof Error) {
    return errorResult(error.message);
  }

  return errorResult("Erro inesperado.");
}

/**
 * Configuration for revalidation after mutations
 */
export const revalidateConfig = {
  cartoes: ["/cartoes"],
  contas: ["/contas", "/lancamentos"],
  categorias: ["/categorias"],
  orcamentos: ["/orcamentos"],
  pagadores: ["/pagadores"],
  anotacoes: ["/anotacoes", "/anotacoes/arquivadas"],
  lancamentos: ["/lancamentos", "/contas"],
} as const;

/**
 * Revalidates paths for a specific entity
 * @param entity - The entity type
 */
export function revalidateForEntity(
  entity: keyof typeof revalidateConfig
): void {
  revalidateConfig[entity].forEach((path) => revalidatePath(path));
}

/**
 * Options for action handler
 */
interface ActionHandlerOptions {
  /** Paths to revalidate after successful execution */
  revalidatePaths?: string[];
  /** Entity to revalidate (uses predefined config) */
  revalidateEntity?: keyof typeof revalidateConfig;
}

/**
 * Creates a standardized action handler with automatic user auth and error handling
 *
 * @param schema - Zod schema for input validation
 * @param handler - Handler function that receives validated data and userId
 * @param options - Additional options for the action
 * @returns Action function that can be called from client
 *
 * @example
 * ```ts
 * export const createItemAction = createActionHandler(
 *   createItemSchema,
 *   async (data, userId) => {
 *     await db.insert(items).values({ ...data, userId });
 *     return "Item criado com sucesso.";
 *   },
 *   { revalidateEntity: 'items' }
 * );
 * ```
 */
export function createActionHandler<TInput, TResult = string>(
  schema: z.ZodSchema<TInput>,
  handler: (data: TInput, userId: string) => Promise<TResult>,
  options?: ActionHandlerOptions
) {
  return async (input: unknown): Promise<ActionResult<TResult>> => {
    try {
      // Get authenticated user
      const user = await getUser();

      // Validate input
      const data = schema.parse(input);

      // Execute handler
      const result = await handler(data, user.id);

      // Revalidate paths if configured
      if (options?.revalidateEntity) {
        revalidateForEntity(options.revalidateEntity);
      } else if (options?.revalidatePaths) {
        options.revalidatePaths.forEach((path) => revalidatePath(path));
      }

      // Return success with message (if result is string) or data
      if (typeof result === "string") {
        return { success: true, message: result };
      }

      return { success: true, message: "Operação realizada com sucesso.", data: result };
    } catch (error) {
      return handleActionError(error);
    }
  };
}
