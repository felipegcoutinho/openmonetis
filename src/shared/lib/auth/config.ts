import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { GoogleProfile } from "better-auth/social-providers";
import { seedDefaultCategoriesForUser } from "@/shared/lib/categories/defaults";
import { db, schema } from "@/shared/lib/db";
import { ensureDefaultPagadorForUser } from "@/shared/lib/payers/defaults";
import { normalizeNameFromEmail } from "@/shared/lib/payers/utils";

// ============================================================================
// GOOGLE OAUTH CONFIGURATION
// ============================================================================

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Extrai nome do usuário do perfil do Google com fallback hierárquico:
 * 1. profile.name (nome completo)
 * 2. profile.given_name + profile.family_name
 * 3. Nome extraído do email
 * 4. "Usuário" (fallback final)
 */
function getNameFromGoogleProfile(profile: GoogleProfile): string {
	const fullName = profile.name?.trim();
	if (fullName) return fullName;

	const fromGivenFamily = [profile.given_name, profile.family_name]
		.filter(Boolean)
		.join(" ")
		.trim();
	if (fromGivenFamily) return fromGivenFamily;

	const fromEmail = profile.email
		? normalizeNameFromEmail(profile.email)
		: undefined;

	return fromEmail ?? "Usuário";
}

// ============================================================================
// BETTER AUTH INSTANCE
// ============================================================================

export const auth = betterAuth({
	// Base URL configuration
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

	// Trust host configuration for production environments
	trustedOrigins: process.env.BETTER_AUTH_URL
		? [process.env.BETTER_AUTH_URL]
		: [],

	// Email/Password authentication
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},

	// Rate limiting
	rateLimit: {
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 3 },
		},
	},

	// Database adapter (Drizzle + PostgreSQL)
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		camelCase: true,
	}),

	// Session configuration - Safari compatibility
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},

	// Advanced configuration for Safari compatibility
	advanced: {
		cookieOptions: {
			sameSite: "lax", // Safari compatible
			secure: process.env.NODE_ENV === "production", // HTTPS in production only
			httpOnly: true,
		},
		crossSubDomainCookies: {
			enabled: false, // Disable for better Safari compatibility
		},
	},

	// Plugins
	plugins: [
		passkey({
			rpName: "OpenMonetis",
		}),
	],

	// Google OAuth (se configurado)
	socialProviders:
		googleClientId && googleClientSecret
			? {
					google: {
						clientId: googleClientId,
						clientSecret: googleClientSecret,
						mapProfileToUser: (profile) => ({
							name: getNameFromGoogleProfile(profile),
							email: profile.email,
							image: profile.picture,
							emailVerified: profile.email_verified,
						}),
					},
				}
			: undefined,

	// Database hooks - Executados após eventos do DB
	databaseHooks: {
		user: {
			create: {
				/**
				 * Após criar novo usuário, inicializa:
				 * 1. Categorias padrão (Receitas/Despesas)
				 * 2. Payer padrão (vinculado ao usuário)
				 */
				after: async (user) => {
					// Se falhar aqui, o usuário já foi criado - considere usar queue para retry
					try {
						await seedDefaultCategoriesForUser(user.id);
						await ensureDefaultPagadorForUser({
							id: user.id,
							name: user.name ?? undefined,
							email: user.email ?? undefined,
							image: user.image ?? undefined,
						});
					} catch (error) {
						console.error(
							"[Auth] Falha ao criar dados padrão do usuário:",
							error,
						);
					}
				},
			},
		},
	},
});

// Aviso em desenvolvimento se Google OAuth não estiver configurado
if (!googleClientId && process.env.NODE_ENV === "development") {
	console.warn(
		"[Auth] Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
	);
}
