import { and, desc, eq, type SQL } from "drizzle-orm";
import {
	cartoes,
	categorias,
	compartilhamentosPagador,
	contas,
	lancamentos,
	pagadores,
	user as usersTable,
} from "@/db/schema";
import { db } from "@/lib/db";

export type ShareData = {
	id: string;
	userId: string;
	name: string;
	email: string;
	createdAt: string;
};

export async function fetchPagadorShares(
	pagadorId: string,
): Promise<ShareData[]> {
	const shareRows = await db
		.select({
			id: compartilhamentosPagador.id,
			sharedWithUserId: compartilhamentosPagador.sharedWithUserId,
			createdAt: compartilhamentosPagador.createdAt,
			userName: usersTable.name,
			userEmail: usersTable.email,
		})
		.from(compartilhamentosPagador)
		.innerJoin(
			usersTable,
			eq(compartilhamentosPagador.sharedWithUserId, usersTable.id),
		)
		.where(eq(compartilhamentosPagador.pagadorId, pagadorId));

	return shareRows.map((share) => ({
		id: share.id,
		userId: share.sharedWithUserId,
		name: share.userName ?? "Usuário",
		email: share.userEmail ?? "email não informado",
		createdAt: share.createdAt?.toISOString() ?? new Date().toISOString(),
	}));
}

export async function fetchCurrentUserShare(
	pagadorId: string,
	userId: string,
): Promise<{ id: string; createdAt: string } | null> {
	const shareRow = await db.query.compartilhamentosPagador.findFirst({
		columns: {
			id: true,
			createdAt: true,
		},
		where: and(
			eq(compartilhamentosPagador.pagadorId, pagadorId),
			eq(compartilhamentosPagador.sharedWithUserId, userId),
		),
	});

	if (!shareRow) {
		return null;
	}

	return {
		id: shareRow.id,
		createdAt: shareRow.createdAt?.toISOString() ?? new Date().toISOString(),
	};
}

export async function fetchPagadorLancamentos(filters: SQL[]) {
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
		.where(and(...filters))
		.orderBy(desc(lancamentos.purchaseDate), desc(lancamentos.createdAt));

	// Transformar resultado para o formato esperado
	return lancamentoRows.map((row: Record<string, unknown>) => ({
		...row.lancamento,
		pagador: row.pagador,
		conta: row.conta,
		cartao: row.cartao,
		categoria: row.categoria,
	}));
}
