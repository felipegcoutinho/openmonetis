import { desc, eq } from "drizzle-orm";
import { apiTokens } from "@/db/schema";
import { db, schema } from "@/shared/lib/db";

interface UserPreferences {
	statementNoteAsColumn: boolean;
	transactionsColumnOrder: string[] | null;
	attachmentMaxSizeMb: number;
	showTransactionSummary: boolean;
	groupTransactionsByDate: boolean;
	hideAnticipatedInstallments: boolean;
}

interface ApiToken {
	id: string;
	name: string;
	tokenPrefix: string;
	lastUsedAt: Date | null;
	lastUsedIp: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

async function fetchAuthProvider(userId: string): Promise<string> {
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
			statementNoteAsColumn: schema.userPreferences.statementNoteAsColumn,
			transactionsColumnOrder: schema.userPreferences.transactionsColumnOrder,
			attachmentMaxSizeMb: schema.userPreferences.attachmentMaxSizeMb,
			showTransactionSummary: schema.userPreferences.showTransactionSummary,
			groupTransactionsByDate: schema.userPreferences.groupTransactionsByDate,
			hideAnticipatedInstallments:
				schema.userPreferences.hideAnticipatedInstallments,
		})
		.from(schema.userPreferences)
		.where(eq(schema.userPreferences.userId, userId))
		.limit(1);

	if (!result[0]) return null;

	return result[0];
}

async function fetchApiTokens(userId: string): Promise<ApiToken[]> {
	return db
		.select({
			id: apiTokens.id,
			name: apiTokens.name,
			tokenPrefix: apiTokens.tokenPrefix,
			lastUsedAt: apiTokens.lastUsedAt,
			lastUsedIp: apiTokens.lastUsedIp,
			createdAt: apiTokens.createdAt,
			expiresAt: apiTokens.expiresAt,
			revokedAt: apiTokens.revokedAt,
		})
		.from(apiTokens)
		.where(eq(apiTokens.userId, userId))
		.orderBy(desc(apiTokens.createdAt));
}

export async function fetchSettingsPageData(userId: string) {
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
