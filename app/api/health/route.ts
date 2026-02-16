import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const APP_VERSION = "1.0.0";

/**
 * Health check endpoint para Docker, monitoring e OpenMonetis Companion
 * GET /api/health
 *
 * Retorna status 200 se a aplicação está saudável
 * Verifica conexão com banco de dados
 * Usado pelo app Android para validar URL do servidor
 */
export async function GET() {
	try {
		// Tenta fazer uma query simples no banco para verificar conexão
		// Isso garante que o app está conectado ao banco antes de considerar "healthy"
		await db.execute("SELECT 1");

		return NextResponse.json(
			{
				status: "ok",
				name: "OpenMonetis",
				version: APP_VERSION,
				timestamp: new Date().toISOString(),
			},
			{ status: 200 },
		);
	} catch (error) {
		// Se houver erro na conexão com banco, retorna status 503 (Service Unavailable)
		console.error("Health check failed:", error);

		return NextResponse.json(
			{
				status: "error",
				name: "OpenMonetis",
				version: APP_VERSION,
				timestamp: new Date().toISOString(),
				message: "Database connection failed",
			},
			{ status: 503 },
		);
	}
}
