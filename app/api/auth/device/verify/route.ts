/**
 * POST /api/auth/device/verify
 *
 * Valida se um token de API é válido.
 * Usado pelo app Android durante o setup.
 */

import { validateApiToken, extractBearerToken } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extrair token do header
    const authHeader = request.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token não fornecido" },
        { status: 401 }
      );
    }

    // Validar JWT
    const payload = validateApiToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    // Verificar se token não foi revogado
    const tokenRecord = await db.query.apiTokens.findFirst({
      where: and(
        eq(apiTokens.id, payload.tokenId),
        eq(apiTokens.userId, payload.sub),
        isNull(apiTokens.revokedAt)
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { valid: false, error: "Token revogado ou não encontrado" },
        { status: 401 }
      );
    }

    // Atualizar último uso
    await db
      .update(apiTokens)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })
      .where(eq(apiTokens.id, payload.tokenId));

    return NextResponse.json({
      valid: true,
      userId: payload.sub,
      tokenId: payload.tokenId,
      tokenName: tokenRecord.name,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error("[API] Error verifying device token:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao validar token" },
      { status: 500 }
    );
  }
}
