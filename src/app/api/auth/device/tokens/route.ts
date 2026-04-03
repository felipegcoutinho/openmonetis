import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { connection, NextResponse } from "next/server";
import { apiTokens } from "@/db/schema";
import { auth } from "@/shared/lib/auth/config";
import { db } from "@/shared/lib/db";

export async function GET() {
	await connection();

	// Verificar autenticação via sessão web
	const requestHeaders = new Headers(await headers());
	const session = await auth.api.getSession({ headers: requestHeaders });

	if (!session?.user) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}

	try {
		// Buscar tokens ativos do usuário
		const activeTokens = await db
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
			.where(
				and(eq(apiTokens.userId, session.user.id), isNull(apiTokens.revokedAt)),
			)
			.orderBy(desc(apiTokens.createdAt));

		return NextResponse.json({ tokens: activeTokens });
	} catch (error) {
		console.error("[API] Error listing device tokens:", error);
		return NextResponse.json(
			{ error: "Erro ao listar tokens" },
			{ status: 500 },
		);
	}
}
