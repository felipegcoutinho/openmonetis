/**
 * GET /api/auth/device/tokens
 *
 * Lista todos os tokens de API do usuário.
 * Requer sessão web autenticada.
 */

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar autenticação via sessão web
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar tokens ativos do usuário
    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        tokenPrefix: apiTokens.tokenPrefix,
        lastUsedAt: apiTokens.lastUsedAt,
        lastUsedIp: apiTokens.lastUsedIp,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, session.user.id))
      .orderBy(desc(apiTokens.createdAt));

    // Separar tokens ativos e revogados
    const activeTokens = tokens.filter((t) => !t.expiresAt || new Date(t.expiresAt) > new Date());

    return NextResponse.json({ tokens: activeTokens });
  } catch (error) {
    console.error("[API] Error listing device tokens:", error);
    return NextResponse.json(
      { error: "Erro ao listar tokens" },
      { status: 500 }
    );
  }
}
