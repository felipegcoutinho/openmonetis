#!/usr/bin/env tsx
/**
 * Patch de migração 1.6.3 → 1.6.4: corrige lançamentos parcelados criados antes da v1.6.4.
 *
 * Antes da v1.6.4 todas as parcelas tinham a mesma data de compra (purchaseDate).
 * Este script:
 * 1. Define originalPurchaseDate = data real da compra (da 1ª parcela) em todas as parcelas da série
 * 2. Ajusta purchaseDate de cada parcela para o mês efetivo (1ª = base, 2ª = +1 mês, etc.)
 *
 * Uso: pnpm db:migrate-parcelado-164
 * Docker: docker exec openmonetis_app pnpm exec tsx scripts/migrate-parcelado-164.ts
 * Requer: DATABASE_URL no .env (ou nas variáveis do container)
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { lancamentos } from "../db/schema";
import { addMonthsToDate } from "../lib/utils/date";

config();

const CONDITION_PARCELADO = "Parcelado";

function toDateOnly(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error("DATABASE_URL não definida. Configure no .env ou no container.");
		process.exit(1);
	}

	const pool = new Pool({ connectionString: databaseUrl });
	const db = drizzle(pool, { schema });

	console.log("Patch 1.6.3 → 1.6.4: corrigindo lançamentos parcelados...\n");

	const rows = await db
		.select({
			id: lancamentos.id,
			seriesId: lancamentos.seriesId,
			purchaseDate: lancamentos.purchaseDate,
			currentInstallment: lancamentos.currentInstallment,
			originalPurchaseDate: lancamentos.originalPurchaseDate,
		})
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.condition, CONDITION_PARCELADO),
				isNotNull(lancamentos.seriesId),
				isNull(lancamentos.originalPurchaseDate),
			),
		);

	if (rows.length === 0) {
		console.log("Nenhum lançamento parcelado pendente de migração.");
		await pool.end();
		return;
	}

	// Agrupar por seriesId e ordenar por parcela
	const bySeries = new Map<string, typeof rows>();
	for (const row of rows) {
		const key = row.seriesId ?? row.id;
		if (!bySeries.has(key)) bySeries.set(key, []);
		bySeries.get(key)!.push(row);
	}
	for (const group of bySeries.values()) {
		group.sort(
			(a, b) => (a.currentInstallment ?? 0) - (b.currentInstallment ?? 0),
		);
	}

	let updated = 0;
	for (const group of bySeries.values()) {
		if (group.length === 0) continue;
		const first = group[0]!;
		const baseDate =
			first.purchaseDate instanceof Date
				? toDateOnly(first.purchaseDate)
				: new Date(first.purchaseDate as unknown as string);

		for (const row of group) {
			const installmentIndex = (row.currentInstallment ?? 1) - 1;
			const effectiveDate = addMonthsToDate(baseDate, installmentIndex);

			await db
				.update(lancamentos)
				.set({
					originalPurchaseDate: baseDate,
					purchaseDate: effectiveDate,
				})
				.where(eq(lancamentos.id, row.id));
			updated++;
		}
	}

	console.log(`Concluído: ${updated} lançamento(s) parcelado(s) corrigido(s).`);
	await pool.end();
}

main().catch(async () => {
	process.exit(1);
});
