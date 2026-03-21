"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { importCategoryMappings } from "@/db/schema";
import { normalizeDescriptionKey } from "@/features/transactions/lib/import-utils";
import { getUserId } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";


// Retorna um map de descriptionKey → categoryId para as descrições fornecidas
export async function fetchCategoryMappings(
	descriptions: string[],
): Promise<Record<string, string>> {
	const userId = await getUserId();
	const keys = descriptions.map(normalizeDescriptionKey).filter(Boolean);
	if (keys.length === 0) return {};

	const rows = await db
		.select({
			descriptionKey: importCategoryMappings.descriptionKey,
			categoryId: importCategoryMappings.categoryId,
		})
		.from(importCategoryMappings)
		.where(
			and(
				eq(importCategoryMappings.userId, userId),
				inArray(importCategoryMappings.descriptionKey, keys),
			),
		);

	return Object.fromEntries(rows.map((r) => [r.descriptionKey, r.categoryId]));
}

// Salva/atualiza mapeamentos description → category após uma importação
export async function saveCategoryMappings(
	rows: { description: string; categoryId: string | null }[],
): Promise<void> {
	const userId = await getUserId();

	const toUpsert = rows
		.filter((r) => r.categoryId !== null)
		.map((r) => ({
			userId,
			descriptionKey: normalizeDescriptionKey(r.description),
			categoryId: r.categoryId as string,
			updatedAt: new Date(),
		}))
		.filter((r) => r.descriptionKey.length > 0);

	if (toUpsert.length === 0) return;

	await db
		.insert(importCategoryMappings)
		.values(toUpsert)
		.onConflictDoUpdate({
			target: [importCategoryMappings.userId, importCategoryMappings.descriptionKey],
			set: {
				categoryId: sql`excluded.category_id`,
				updatedAt: sql`excluded.updated_at`,
			},
		});
}
