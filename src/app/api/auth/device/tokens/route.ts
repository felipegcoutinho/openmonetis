import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { tokensApi } from "@/db/schema";
import { auth } from "@/shared/lib/auth/config";
import { db } from "@/shared/lib/db";

export async function GET() {
	try {
		// Verificar autenticação via sessão web
		const session = await auth.api.getSession({ headers: await headers() });

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		// Buscar tokens ativos do usuário
		const activeTokens = await db
			.select({
				id: tokensApi.id,
				name: tokensApi.name,
				tokenPrefix: tokensApi.tokenPrefix,
				lastUsedAt: tokensApi.lastUsedAt,
				lastUsedIp: tokensApi.lastUsedIp,
				expiresAt: tokensApi.expiresAt,
				createdAt: tokensApi.createdAt,
			})
			.from(tokensApi)
			.where(
				and(eq(tokensApi.userId, session.user.id), isNull(tokensApi.revokedAt)),
			)
			.orderBy(desc(tokensApi.createdAt));

		return NextResponse.json({ tokens: activeTokens });
	} catch (error) {
		console.error("[API] Error listing device tokens:", error);
		return NextResponse.json(
			{ error: "Erro ao listar tokens" },
			{ status: 500 },
		);
	}
}
