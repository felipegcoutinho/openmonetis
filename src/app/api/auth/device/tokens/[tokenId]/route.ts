import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { tokensApi } from "@/db/schema";
import { auth } from "@/shared/lib/auth/config";
import { db } from "@/shared/lib/db";

interface RouteParams {
	params: Promise<{ tokenId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { tokenId } = await params;

		// Verificar autenticação via sessão web
		const session = await auth.api.getSession({ headers: await headers() });

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		// Verificar se token pertence ao usuário
		const token = await db.query.tokensApi.findFirst({
			where: and(
				eq(tokensApi.id, tokenId),
				eq(tokensApi.userId, session.user.id),
			),
		});

		if (!token) {
			return NextResponse.json(
				{ error: "Token não encontrado" },
				{ status: 404 },
			);
		}

		// Revogar token (soft delete)
		await db
			.update(tokensApi)
			.set({ revokedAt: new Date() })
			.where(eq(tokensApi.id, tokenId));

		return NextResponse.json({
			message: "Token revogado com sucesso",
			tokenId,
		});
	} catch (error) {
		console.error("[API] Error revoking device token:", error);
		return NextResponse.json(
			{ error: "Erro ao revogar token" },
			{ status: 500 },
		);
	}
}
