import { config } from "dotenv";

/**
 * Endereço "from" para envio de e-mails via Resend.
 * Lê RESEND_FROM_EMAIL do .env (valor deve estar entre aspas se tiver espaço:
 * Garante carregamento do .env no contexto da chamada (ex.: Server Actions).
 */
const FALLBACK_FROM = "OpenMonetis <noreply@resend.dev>";

export function getResendFromEmail(): string {
	// Garantir que .env foi carregado (não sobrescreve variáveis já definidas)
	config({ path: ".env" });
	const raw = process.env.RESEND_FROM_EMAIL;
	const value = typeof raw === "string" ? raw.trim() : "";
	return value.length > 0 ? value : FALLBACK_FROM;
}
