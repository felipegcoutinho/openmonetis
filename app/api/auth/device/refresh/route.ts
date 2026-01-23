/**
 * POST /api/auth/device/refresh
 *
 * Atualiza access token usando refresh token.
 * Usado pelo app Android quando o access token expira.
 */

import { refreshAccessToken, extractBearerToken, verifyJwt, hashToken } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extrair refresh token do header
    const authHeader = request.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Refresh token não fornecido" },
        { status: 401 }
      );
    }

    // Validar refresh token
    const payload = verifyJwt(token);

    if (!payload || payload.type !== "api_refresh") {
      return NextResponse.json(
        { error: "Refresh token inválido ou expirado" },
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
        { error: "Token revogado ou não encontrado" },
        { status: 401 }
      );
    }

    // Gerar novo access token
    const result = refreshAccessToken(token);

    if (!result) {
      return NextResponse.json(
        { error: "Não foi possível renovar o token" },
        { status: 401 }
      );
    }

    // Atualizar hash do token e último uso
    await db
      .update(apiTokens)
      .set({
        tokenHash: hashToken(result.accessToken),
        lastUsedAt: new Date(),
        lastUsedIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        expiresAt: result.expiresAt,
      })
      .where(eq(apiTokens.id, payload.tokenId));

    return NextResponse.json({
      accessToken: result.accessToken,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] Error refreshing device token:", error);
    return NextResponse.json(
      { error: "Erro ao renovar token" },
      { status: 500 }
    );
  }
}
