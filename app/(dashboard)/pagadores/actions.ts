"use server";

import { pagadores, pagadorShares, user } from "@/db/schema";
import { handleActionError, revalidateForEntity } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/server";
import {
  DEFAULT_PAGADOR_AVATAR,
  PAGADOR_ROLE_ADMIN,
  PAGADOR_ROLE_TERCEIRO,
  PAGADOR_STATUS_OPTIONS,
} from "@/lib/pagadores/constants";
import { normalizeAvatarPath } from "@/lib/pagadores/utils";
import { noteSchema, uuidSchema } from "@/lib/schemas/common";
import { normalizeOptionalString } from "@/lib/utils/string";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const statusEnum = z.enum(PAGADOR_STATUS_OPTIONS as [string, ...string[]], {
  errorMap: () => ({
    message: "Selecione um status válido.",
  }),
});

const baseSchema = z.object({
  name: z
    .string({ message: "Informe o nome do pagador." })
    .trim()
    .min(1, "Informe o nome do pagador."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .transform((value) => normalizeOptionalString(value)),
  status: statusEnum,
  note: noteSchema,
  avatarUrl: z.string().trim().optional(),
  isAutoSend: z.boolean().optional().default(false),
});

const createSchema = baseSchema;

const updateSchema = baseSchema.extend({
  id: uuidSchema("Pagador"),
});

const deleteSchema = z.object({
  id: uuidSchema("Pagador"),
});

const shareDeleteSchema = z.object({
  shareId: uuidSchema("Compartilhamento"),
});

const shareCodeJoinSchema = z.object({
  code: z
    .string({ message: "Informe o código." })
    .trim()
    .min(8, "Código inválido."),
});

const shareCodeRegenerateSchema = z.object({
  pagadorId: uuidSchema("Pagador"),
});

type CreateInput = z.infer<typeof createSchema>;
type UpdateInput = z.infer<typeof updateSchema>;
type DeleteInput = z.infer<typeof deleteSchema>;
type ShareDeleteInput = z.infer<typeof shareDeleteSchema>;
type ShareCodeJoinInput = z.infer<typeof shareCodeJoinSchema>;
type ShareCodeRegenerateInput = z.infer<typeof shareCodeRegenerateSchema>;

const revalidate = () => revalidateForEntity("pagadores");

const generateShareCode = () => {
  // base64url já retorna apenas [a-zA-Z0-9_-]
  // 18 bytes = 24 caracteres em base64
  return randomBytes(18).toString("base64url").slice(0, 24);
};

export async function createPagadorAction(
  input: CreateInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = createSchema.parse(input);

    await db.insert(pagadores).values({
      name: data.name,
      email: data.email,
      status: data.status,
      note: data.note,
      avatarUrl: normalizeAvatarPath(data.avatarUrl) ?? DEFAULT_PAGADOR_AVATAR,
      isAutoSend: data.isAutoSend ?? false,
      role: PAGADOR_ROLE_TERCEIRO,
      shareCode: generateShareCode(),
      userId: user.id,
    });

    revalidate();

    return { success: true, message: "Pagador criado com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updatePagadorAction(
  input: UpdateInput
): Promise<ActionResult> {
  try {
    const currentUser = await getUser();
    const data = updateSchema.parse(input);

    const existing = await db.query.pagadores.findFirst({
      where: and(eq(pagadores.id, data.id), eq(pagadores.userId, currentUser.id)),
    });

    if (!existing) {
      return {
        success: false,
        error: "Pagador não encontrado.",
      };
    }

    await db
      .update(pagadores)
      .set({
        name: data.name,
        email: data.email,
        status: data.status,
        note: data.note,
        avatarUrl:
          normalizeAvatarPath(data.avatarUrl) ?? existing.avatarUrl ?? null,
        isAutoSend: data.isAutoSend ?? false,
        role: existing.role ?? PAGADOR_ROLE_TERCEIRO,
      })
      .where(and(eq(pagadores.id, data.id), eq(pagadores.userId, currentUser.id)));

    // Se o pagador é admin, sincronizar nome com o usuário
    if (existing.role === PAGADOR_ROLE_ADMIN) {
      await db
        .update(user)
        .set({ name: data.name })
        .where(eq(user.id, currentUser.id));

      revalidatePath("/", "layout");
    }

    revalidate();

    return { success: true, message: "Pagador atualizado com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deletePagadorAction(
  input: DeleteInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = deleteSchema.parse(input);

    const existing = await db.query.pagadores.findFirst({
      where: and(eq(pagadores.id, data.id), eq(pagadores.userId, user.id)),
    });

    if (!existing) {
      return {
        success: false,
        error: "Pagador não encontrado.",
      };
    }

    if (existing.role === PAGADOR_ROLE_ADMIN) {
      return {
        success: false,
        error: "Pagadores administradores não podem ser removidos.",
      };
    }

    await db
      .delete(pagadores)
      .where(and(eq(pagadores.id, data.id), eq(pagadores.userId, user.id)));

    revalidate();

    return { success: true, message: "Pagador removido com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function joinPagadorByShareCodeAction(
  input: ShareCodeJoinInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = shareCodeJoinSchema.parse(input);

    const pagadorRow = await db.query.pagadores.findFirst({
      where: eq(pagadores.shareCode, data.code),
    });

    if (!pagadorRow) {
      return { success: false, error: "Código inválido ou expirado." };
    }

    if (pagadorRow.userId === user.id) {
      return {
        success: false,
        error: "Você já é o proprietário deste pagador.",
      };
    }

    const existingShare = await db.query.pagadorShares.findFirst({
      where: and(
        eq(pagadorShares.pagadorId, pagadorRow.id),
        eq(pagadorShares.sharedWithUserId, user.id)
      ),
    });

    if (existingShare) {
      return {
        success: false,
        error: "Você já possui acesso a este pagador.",
      };
    }

    await db.insert(pagadorShares).values({
      pagadorId: pagadorRow.id,
      sharedWithUserId: user.id,
      permission: "read",
      createdByUserId: pagadorRow.userId,
    });

    revalidate();

    return { success: true, message: "Pagador adicionado à sua lista." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deletePagadorShareAction(
  input: ShareDeleteInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = shareDeleteSchema.parse(input);

    const existing = await db.query.pagadorShares.findFirst({
      columns: {
        id: true,
        pagadorId: true,
        sharedWithUserId: true,
      },
      where: eq(pagadorShares.id, data.shareId),
      with: {
        pagador: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Permitir que o owner OU o próprio usuário compartilhado remova o share
    if (!existing || (existing.pagador.userId !== user.id && existing.sharedWithUserId !== user.id)) {
      return {
        success: false,
        error: "Compartilhamento não encontrado.",
      };
    }

    await db
      .delete(pagadorShares)
      .where(eq(pagadorShares.id, data.shareId));

    revalidate();
    revalidatePath(`/pagadores/${existing.pagadorId}`);

    return { success: true, message: "Compartilhamento removido." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function regeneratePagadorShareCodeAction(
  input: ShareCodeRegenerateInput
): Promise<{ success: true; message: string; code: string } | ActionResult> {
  try {
    const user = await getUser();
    const data = shareCodeRegenerateSchema.parse(input);

    const existing = await db.query.pagadores.findFirst({
      columns: { id: true, userId: true },
      where: and(eq(pagadores.id, data.pagadorId), eq(pagadores.userId, user.id)),
    });

    if (!existing) {
      return { success: false, error: "Pagador não encontrado." };
    }

    let attempts = 0;
    while (attempts < 5) {
      const newCode = generateShareCode();
      try {
        await db
          .update(pagadores)
          .set({ shareCode: newCode })
          .where(and(eq(pagadores.id, data.pagadorId), eq(pagadores.userId, user.id)));

        revalidate();
        revalidatePath(`/pagadores/${data.pagadorId}`);
        return {
          success: true,
          message: "Código atualizado com sucesso.",
          code: newCode,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          "constraint" in error &&
          // @ts-expect-error constraint is present in postgres errors
          error.constraint === "pagadores_share_code_key"
        ) {
          attempts += 1;
          continue;
        }
        throw error;
      }
    }

    return {
      success: false,
      error: "Não foi possível gerar um código único. Tente novamente.",
    };
  } catch (error) {
    return handleActionError(error);
  }
}
