import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.BETTER_AUTH_URL?.replace(/\/$/, "");

export const authClient = createAuthClient({
	...(baseURL ? { baseURL } : {}),
	plugins: [passkeyClient()],
});

/**
 * Indica se o login com Google está habilitado.
 * Verifica se as credenciais do Google OAuth estão configuradas.
 *
 * IMPORTANTE: Como variáveis de ambiente sem prefixo NEXT_PUBLIC_ não estão
 * disponíveis no cliente, esta verificação deve ser feita no servidor.
 * Por isso, sempre retornamos true aqui e a validação real acontece no servidor.
 *
 * Para desabilitar o Google OAuth, remova ou deixe vazias as variáveis:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */
export const googleSignInAvailable = true;
