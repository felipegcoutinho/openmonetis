"use server";

import { inboxItems, lancamentos } from "@/db/schema";
import { handleActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentPeriod } from "@/lib/utils/period";

const processInboxSchema = z.object({
  inboxItemId: z.string().uuid("ID do item inválido"),
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  purchaseDate: z.string().min(1, "Data é obrigatória"),
  transactionType: z.enum(["Despesa", "Receita"]),
  condition: z.string().min(1, "Condição é obrigatória"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  categoriaId: z.string().uuid("Categoria inválida"),
  contaId: z.string().uuid("Conta inválida").optional(),
  cartaoId: z.string().uuid("Cartão inválido").optional(),
  note: z.string().optional(),
});

const discardInboxSchema = z.object({
  inboxItemId: z.string().uuid("ID do item inválido"),
  reason: z.string().optional(),
});

const bulkDiscardSchema = z.object({
  inboxItemIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um item"),
});

function revalidateInbox() {
  revalidatePath("/caixa-de-entrada");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}

export async function processInboxItemAction(
  input: z.infer<typeof processInboxSchema>
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = processInboxSchema.parse(input);

    // Verificar se item existe e pertence ao usuário
    const [item] = await db
      .select()
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.id, data.inboxItemId),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending")
        )
      )
      .limit(1);

    if (!item) {
      return { success: false, error: "Item não encontrado ou já processado." };
    }

    // Determinar período baseado na data de compra
    const purchaseDate = new Date(data.purchaseDate);
    const period = getCurrentPeriod(purchaseDate);

    // Criar lançamento
    const [newLancamento] = await db
      .insert(lancamentos)
      .values({
        userId: user.id,
        name: data.name,
        amount: data.amount.toString(),
        purchaseDate: purchaseDate,
        transactionType: data.transactionType,
        condition: data.condition,
        paymentMethod: data.paymentMethod,
        categoriaId: data.categoriaId,
        contaId: data.contaId,
        cartaoId: data.cartaoId,
        note: data.note,
        period,
      })
      .returning({ id: lancamentos.id });

    // Marcar item como processado
    await db
      .update(inboxItems)
      .set({
        status: "processed",
        processedAt: new Date(),
        lancamentoId: newLancamento.id,
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, data.inboxItemId));

    revalidateInbox();

    return { success: true, message: "Lançamento criado com sucesso!" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function discardInboxItemAction(
  input: z.infer<typeof discardInboxSchema>
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = discardInboxSchema.parse(input);

    // Verificar se item existe e pertence ao usuário
    const [item] = await db
      .select()
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.id, data.inboxItemId),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending")
        )
      )
      .limit(1);

    if (!item) {
      return { success: false, error: "Item não encontrado ou já processado." };
    }

    // Marcar item como descartado
    await db
      .update(inboxItems)
      .set({
        status: "discarded",
        discardedAt: new Date(),
        discardReason: data.reason,
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, data.inboxItemId));

    revalidateInbox();

    return { success: true, message: "Item descartado." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDiscardInboxItemsAction(
  input: z.infer<typeof bulkDiscardSchema>
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = bulkDiscardSchema.parse(input);

    // Marcar todos os itens como descartados
    await db
      .update(inboxItems)
      .set({
        status: "discarded",
        discardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(inboxItems.id, data.inboxItemIds),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending")
        )
      );

    revalidateInbox();

    return {
      success: true,
      message: `${data.inboxItemIds.length} item(s) descartado(s).`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
