import "server-only";

import { fetchEstablishmentLogoMap } from "./establishment-logo-queries";
import { toNameKey } from "./index";
import { buildLogoDevUrl } from "./server";
import type { LogoPrefetchEntry } from "./types";

export async function prefetchLogoMappings(
	userId: string,
	names: string[],
): Promise<LogoPrefetchEntry[]> {
	const uniqueNames = [
		...new Set(
			names.filter((n) => typeof n === "string" && n.trim().length > 0),
		),
	];
	if (uniqueNames.length === 0) return [];

	const map = await fetchEstablishmentLogoMap(userId, uniqueNames);

	const seen = new Set<string>();
	const entries: LogoPrefetchEntry[] = [];
	for (const name of uniqueNames) {
		const nameKey = toNameKey(name);
		if (seen.has(nameKey)) continue;
		seen.add(nameKey);
		const domain = map.get(nameKey) ?? null;
		entries.push({ nameKey, domain, logoUrl: buildLogoDevUrl(domain) });
	}
	return entries;
}
