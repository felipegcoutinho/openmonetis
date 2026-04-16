import { and, eq, inArray } from "drizzle-orm";
import { establishmentLogos } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { toNameKey } from "@/shared/lib/logo";

export { toNameKey };

/**
 * Busca o domínio salvo para um único estabelecimento.
 */
export async function fetchEstablishmentLogoDomain(
	userId: string,
	name: string,
): Promise<string | null> {
	const nameKey = toNameKey(name);
	const row = await db.query.establishmentLogos.findFirst({
		where: and(
			eq(establishmentLogos.userId, userId),
			eq(establishmentLogos.nameKey, nameKey),
		),
		columns: { domain: true },
	});
	return row?.domain ?? null;
}

/**
 * Busca domínios salvos para múltiplos nomes de uma vez (evita N+1).
 * Retorna um Map de nameKey → domain.
 */
export async function fetchEstablishmentLogoMap(
	userId: string,
	names: string[],
): Promise<Map<string, string>> {
	const nameKeys = [...new Set(names.map(toNameKey))];
	if (nameKeys.length === 0) return new Map();

	const rows = await db.query.establishmentLogos.findMany({
		where: and(
			eq(establishmentLogos.userId, userId),
			inArray(establishmentLogos.nameKey, nameKeys),
		),
		columns: { nameKey: true, domain: true },
	});

	return new Map(rows.map((r) => [r.nameKey, r.domain]));
}
