import { desc, eq } from "drizzle-orm";
import { tokensApi } from "@/db/schema";
import { db, schema } from "@/lib/db";

export interface UserPreferences {
	disableMagnetlines: boolean;
	extratoNoteAsColumn: boolean;
	lancamentosColumnOrder: string[] | null;
	systemFont: string;
	moneyFont: string;
}

export interface ApiToken {
	id: string;
	name: string;
	tokenPrefix: string;
	lastUsedAt: Date | null;
	lastUsedIp: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

export async function fetchAuthProvider(userId: string): Promise<string> {
	const userAccount = await db.query.account.findFirst({
		where: eq(schema.account.userId, userId),
	});
	return userAccount?.providerId || "credential";
}

export async function fetchUserPreferences(
	userId: string,
): Promise<UserPreferences | null> {
	const result = await db
		.select({
			disableMagnetlines: schema.preferenciasUsuario.disableMagnetlines,
			extratoNoteAsColumn: schema.preferenciasUsuario.extratoNoteAsColumn,
			lancamentosColumnOrder: schema.preferenciasUsuario.lancamentosColumnOrder,
			systemFont: schema.preferenciasUsuario.systemFont,
			moneyFont: schema.preferenciasUsuario.moneyFont,
		})
		.from(schema.preferenciasUsuario)
		.where(eq(schema.preferenciasUsuario.userId, userId))
		.limit(1);

	return result[0] || null;
}

export async function fetchApiTokens(userId: string): Promise<ApiToken[]> {
	return db
		.select({
			id: tokensApi.id,
			name: tokensApi.name,
			tokenPrefix: tokensApi.tokenPrefix,
			lastUsedAt: tokensApi.lastUsedAt,
			lastUsedIp: tokensApi.lastUsedIp,
			createdAt: tokensApi.createdAt,
			expiresAt: tokensApi.expiresAt,
			revokedAt: tokensApi.revokedAt,
		})
		.from(tokensApi)
		.where(eq(tokensApi.userId, userId))
		.orderBy(desc(tokensApi.createdAt));
}

export async function fetchAjustesPageData(userId: string) {
	const [authProvider, userPreferences, userApiTokens] = await Promise.all([
		fetchAuthProvider(userId),
		fetchUserPreferences(userId),
		fetchApiTokens(userId),
	]);

	return {
		authProvider,
		userPreferences,
		userApiTokens,
	};
}
