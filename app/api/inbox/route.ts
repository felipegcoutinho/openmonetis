/**
 * POST /api/inbox
 *
 * Recebe uma notificação do app Android.
 * Requer autenticação via API token (formato os_xxx).
 */

import { extractBearerToken, hashToken } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens, inboxItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { inboxItemSchema } from "@/lib/schemas/inbox";
import { z } from "zod";

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // 100 requests
const RATE_WINDOW = 60 * 1000; // por minuto

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Extrair token do header
    const authHeader = request.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    // Validar token os_xxx via hash
    if (!token.startsWith("os_")) {
      return NextResponse.json(
        { error: "Formato de token inválido" },
        { status: 401 }
      );
    }

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
        { error: "Token inválido ou revogado" },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(tokenRecord.userId)) {
      return NextResponse.json(
        { error: "Limite de requisições excedido", retryAfter: 60 },
        { status: 429 }
      );
    }

    // Validar body
    const body = await request.json();
    const data = inboxItemSchema.parse(body);

    // Inserir item na inbox
    const [inserted] = await db
      .insert(inboxItems)
      .values({
        userId: tokenRecord.userId,
        sourceApp: data.sourceApp,
        sourceAppName: data.sourceAppName,
        deviceId: data.deviceId,
        originalTitle: data.originalTitle,
        originalText: data.originalText,
        notificationTimestamp: data.notificationTimestamp,
        parsedName: data.parsedName,
        parsedAmount: data.parsedAmount?.toString(),
        parsedDate: data.parsedDate,
        parsedCardLastDigits: data.parsedCardLastDigits,
        parsedTransactionType: data.parsedTransactionType,
        status: "pending",
      })
      .returning({ id: inboxItems.id });

    // Atualizar último uso do token
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

    return NextResponse.json(
      {
        id: inserted.id,
        clientId: data.clientId,
        message: "Notificação recebida",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    console.error("[API] Error creating inbox item:", error);
    return NextResponse.json(
      { error: "Erro ao processar notificação" },
      { status: 500 }
    );
  }
}
