/**
 * DELETE /api/auth/device/tokens/[tokenId]
 *
 * Revoga um token de API específico.
 * Requer sessão web autenticada.
 */

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ tokenId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tokenId } = await params;

    // Verificar autenticação via sessão web
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se token pertence ao usuário
    const token = await db.query.apiTokens.findFirst({
      where: and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.userId, session.user.id)
      ),
    });

    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 404 }
      );
    }

    // Revogar token (soft delete)
    await db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(eq(apiTokens.id, tokenId));

    return NextResponse.json({
      message: "Token revogado com sucesso",
      tokenId,
    });
  } catch (error) {
    console.error("[API] Error revoking device token:", error);
    return NextResponse.json(
      { error: "Erro ao revogar token" },
      { status: 500 }
    );
  }
}
