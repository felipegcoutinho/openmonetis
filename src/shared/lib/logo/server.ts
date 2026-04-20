/**
 * Helpers server-only para Logo.dev.
 *
 * IMPORTANTE: este módulo lê `process.env.LOGO_DEV_TOKEN`, que não existe
 * no bundle do cliente. Nunca importe este arquivo de Client Components
 * — use o `LogoDevProvider` para propagar o estado `enabled` e consuma
 * `logoUrl` a partir das respostas das API routes.
 */
function getLogoDevToken(): string | undefined {
	const token = process.env.LOGO_DEV_TOKEN;
	return token && token.length > 0 ? token : undefined;
}

/**
 * Indica se a integração Logo.dev está configurada.
 * Usado para habilitar o picker e a exibição de logos na UI.
 */
export function isLogoDevEnabled(): boolean {
	return getLogoDevToken() !== undefined;
}

/**
 * Constrói a URL final da imagem Logo.dev com o token aplicado server-side.
 * Retorna null se o token não estiver configurado ou se o domínio for vazio.
 */
export function buildLogoDevUrl(domain?: string | null): string | null {
	const token = getLogoDevToken();
	if (!token || !domain) return null;
	return `https://img.logo.dev/${domain}?token=${token}&size=64&format=png`;
}
