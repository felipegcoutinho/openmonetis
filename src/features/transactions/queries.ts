import { and, desc, eq, gte, isNull, ne, or, type SQL } from "drizzle-orm";
import {
	cartoes,
	categorias,
	contas,
	lancamentos,
	pagadores,
} from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";

export async function fetchLancamentoFilterSources(userId: string) {
	const [pagadorRows, contaRows, cartaoRows, categoriaRows] = await Promise.all(
		[
			db.query.pagadores.findMany({
				where: eq(pagadores.userId, userId),
			}),
			db.query.contas.findMany({
				where: and(eq(contas.userId, userId), eq(contas.status, "Ativa")),
			}),
			db.query.cartoes.findMany({
				where: and(eq(cartoes.userId, userId), eq(cartoes.status, "Ativo")),
			}),
			db.query.categorias.findMany({
				where: eq(categorias.userId, userId),
			}),
		],
	);

	return { pagadorRows, contaRows, cartaoRows, categoriaRows };
}

export async function fetchLancamentos(filters: SQL[]) {
	const lancamentoRows = await db
		.select({
			lancamento: lancamentos,
			pagador: pagadores,
			conta: contas,
			cartao: cartoes,
			categoria: categorias,
		})
		.from(lancamentos)
		.leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.leftJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
		.leftJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
		.where(
			and(
				...filters,
				// Excluir saldos iniciais de contas que têm excludeInitialBalanceFromIncome = true
				or(
					ne(lancamentos.note, INITIAL_BALANCE_NOTE),
					isNull(contas.excludeInitialBalanceFromIncome),
					eq(contas.excludeInitialBalanceFromIncome, false),
				),
			),
		)
		.orderBy(desc(lancamentos.purchaseDate), desc(lancamentos.createdAt));

	// Transformar resultado para o formato esperado
	return lancamentoRows.map((row) => ({
		...row.lancamento,
		pagador: row.pagador,
		conta: row.conta,
		cartao: row.cartao,
		categoria: row.categoria,
	}));
}

export async function fetchRecentEstablishments(
	userId: string,
): Promise<string[]> {
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	const results = await db
		.select({ name: lancamentos.name })
		.from(lancamentos)
		.where(
			and(
				eq(lancamentos.userId, userId),
				gte(lancamentos.purchaseDate, threeMonthsAgo),
			),
		)
		.orderBy(desc(lancamentos.purchaseDate));

	const uniqueNames = Array.from(
		new Set<string>(
			results
				.map((row) => row.name)
				.filter(
					(name: string | null): name is string =>
						name != null &&
						name.trim().length > 0 &&
						!name.toLowerCase().startsWith("pagamento fatura"),
				),
		),
	);

	return uniqueNames.slice(0, 100);
}
