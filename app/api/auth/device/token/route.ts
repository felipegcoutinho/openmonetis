/**
 * POST /api/auth/device/token
 *
 * Gera um novo token de API para dispositivo.
 * Requer sessão web autenticada.
 */

import { auth } from "@/lib/auth/config";
import { generateTokenPair, hashToken, getTokenPrefix } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTokenSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  deviceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Verificar autenticação via sessão web
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Validar body
    const body = await request.json();
    const { name, deviceId } = createTokenSchema.parse(body);

    // Gerar par de tokens
    const { accessToken, refreshToken, tokenId, expiresAt } = generateTokenPair(
      session.user.id,
      deviceId
    );

    // Salvar hash do token no banco
    await db.insert(apiTokens).values({
      id: tokenId,
      userId: session.user.id,
      name,
      tokenHash: hashToken(accessToken),
      tokenPrefix: getTokenPrefix(accessToken),
      expiresAt,
    });

    // Retornar tokens (mostrados apenas uma vez)
    return NextResponse.json(
      {
        accessToken,
        refreshToken,
        tokenId,
        name,
        expiresAt: expiresAt.toISOString(),
        message: "Token criado com sucesso. Guarde-o em local seguro, ele não será mostrado novamente.",
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

    console.error("[API] Error creating device token:", error);
    return NextResponse.json(
      { error: "Erro ao criar token" },
      { status: 500 }
    );
  }
}
