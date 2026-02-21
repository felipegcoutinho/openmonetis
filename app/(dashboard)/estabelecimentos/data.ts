import { count, eq } from "drizzle-orm";
import { estabelecimentos, lancamentos } from "@/db/schema";
import { db } from "@/lib/db";

export type EstabelecimentoRow = {
	name: string;
	lancamentosCount: number;
	estabelecimentoId: string | null;
};

export async function fetchEstabelecimentosForUser(
	userId: string,
): Promise<EstabelecimentoRow[]> {
	const [countsByName, estabelecimentosRows] = await Promise.all([
		db
			.select({
				name: lancamentos.name,
				count: count().as("count"),
			})
			.from(lancamentos)
			.where(eq(lancamentos.userId, userId))
			.groupBy(lancamentos.name),
		db.query.estabelecimentos.findMany({
			columns: { id: true, name: true },
			where: eq(estabelecimentos.userId, userId),
		}),
	]);

	const map = new Map<
		string,
		{ lancamentosCount: number; estabelecimentoId: string | null }
	>();

	for (const row of countsByName) {
		const name = row.name?.trim();
		if (name == null || name.length === 0) continue;
		map.set(name, {
			lancamentosCount: Number(row.count ?? 0),
			estabelecimentoId: null,
		});
	}

	for (const row of estabelecimentosRows) {
		const name = row.name?.trim();
		if (name == null || name.length === 0) continue;
		const existing = map.get(name);
		if (existing) {
			existing.estabelecimentoId = row.id;
		} else {
			map.set(name, {
				lancamentosCount: 0,
				estabelecimentoId: row.id,
			});
		}
	}

	return Array.from(map.entries())
		.map(([name, data]) => ({
			name,
			lancamentosCount: data.lancamentosCount,
			estabelecimentoId: data.estabelecimentoId,
		}))
		.sort((a, b) =>
			a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
		);
}
