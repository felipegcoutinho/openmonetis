/**
 * Data fetching functions for Caixa de Entrada
 */

import { db } from "@/lib/db";
import { inboxItems, categorias, contas, cartoes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InboxItem, SelectOption } from "@/components/caixa-de-entrada/types";

export async function fetchInboxItems(
  userId: string,
  status: "pending" | "processed" | "discarded" = "pending"
): Promise<InboxItem[]> {
  const items = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.userId, userId), eq(inboxItems.status, status)))
    .orderBy(desc(inboxItems.createdAt));

  return items;
}

export async function fetchInboxItemById(
  userId: string,
  itemId: string
): Promise<InboxItem | null> {
  const [item] = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.id, itemId), eq(inboxItems.userId, userId)))
    .limit(1);

  return item ?? null;
}

export async function fetchCategoriasForSelect(
  userId: string,
  type?: string
): Promise<SelectOption[]> {
  const query = db
    .select({ id: categorias.id, name: categorias.name })
    .from(categorias)
    .where(
      type
        ? and(eq(categorias.userId, userId), eq(categorias.type, type))
        : eq(categorias.userId, userId)
    )
    .orderBy(categorias.name);

  return query;
}

export async function fetchContasForSelect(userId: string): Promise<SelectOption[]> {
  const items = await db
    .select({ id: contas.id, name: contas.name })
    .from(contas)
    .where(and(eq(contas.userId, userId), eq(contas.status, "ativo")))
    .orderBy(contas.name);

  return items;
}

export async function fetchCartoesForSelect(
  userId: string
): Promise<(SelectOption & { lastDigits?: string })[]> {
  const items = await db
    .select({ id: cartoes.id, name: cartoes.name })
    .from(cartoes)
    .where(and(eq(cartoes.userId, userId), eq(cartoes.status, "ativo")))
    .orderBy(cartoes.name);

  return items;
}

export async function fetchPendingInboxCount(userId: string): Promise<number> {
  const items = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(and(eq(inboxItems.userId, userId), eq(inboxItems.status, "pending")));

  return items.length;
}
