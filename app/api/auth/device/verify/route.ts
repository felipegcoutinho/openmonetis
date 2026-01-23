/**
 * POST /api/auth/device/verify
 *
 * Valida se um token de API é válido.
 * Usado pelo app Android durante o setup.
 *
 * Aceita tokens no formato os_xxx (hash-based, sem expiração).
 */

import { extractBearerToken, hashToken } from "@/lib/auth/api-token";
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

    // Validar token os_xxx via hash lookup
    if (!token.startsWith("os_")) {
      return NextResponse.json(
        { valid: false, error: "Formato de token inválido" },
        { status: 401 }
      );
    }

    // Hash do token para buscar no DB
    const tokenHash = hashToken(token);

    // Buscar token no banco
    const tokenRecord = await db.query.apiTokens.findFirst({
      where: and(
        eq(apiTokens.tokenHash, tokenHash),
        isNull(apiTokens.revokedAt)
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { valid: false, error: "Token inválido ou revogado" },
        { status: 401 }
      );
    }

    // Atualizar último uso
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || null;

    await db
      .update(apiTokens)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: clientIp,
      })
      .where(eq(apiTokens.id, tokenRecord.id));

    return NextResponse.json({
      valid: true,
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      tokenName: tokenRecord.name,
    });
  } catch (error) {
    console.error("[API] Error verifying device token:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao validar token" },
      { status: 500 }
    );
  }
}
