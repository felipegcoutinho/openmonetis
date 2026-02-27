import { and, eq } from "drizzle-orm";
import {
	compartilhamentosPagador,
	pagadores,
	user as usersTable,
} from "@/db/schema";
import { db } from "@/lib/db";

export type PagadorWithAccess = typeof pagadores.$inferSelect & {
	canEdit: boolean;
	sharedByName: string | null;
	sharedByEmail: string | null;
	shareId: string | null;
};

export async function fetchPagadoresWithAccess(
	userId: string,
): Promise<PagadorWithAccess[]> {
	const [owned, shared] = await Promise.all([
		db.query.pagadores.findMany({
			where: eq(pagadores.userId, userId),
		}),
		db
			.select({
				shareId: compartilhamentosPagador.id,
				pagador: pagadores,
				ownerName: usersTable.name,
				ownerEmail: usersTable.email,
			})
			.from(compartilhamentosPagador)
			.innerJoin(
				pagadores,
				eq(compartilhamentosPagador.pagadorId, pagadores.id),
			)
			.leftJoin(usersTable, eq(pagadores.userId, usersTable.id))
			.where(eq(compartilhamentosPagador.sharedWithUserId, userId)),
	]);

	const ownedMapped: PagadorWithAccess[] = owned.map((item) => ({
		...item,
		canEdit: true,
		sharedByName: null,
		sharedByEmail: null,
		shareId: null,
	}));

	const sharedMapped: PagadorWithAccess[] = shared.map((item) => ({
		...item.pagador,
		shareCode: null,
		canEdit: false,
		sharedByName: item.ownerName ?? null,
		sharedByEmail: item.ownerEmail ?? null,
		shareId: item.shareId,
	}));

	return [...ownedMapped, ...sharedMapped];
}

export async function getPagadorAccess(userId: string, pagadorId: string) {
	const pagador = await db.query.pagadores.findFirst({
		where: and(eq(pagadores.id, pagadorId)),
	});

	if (!pagador) {
		return null;
	}

	if (pagador.userId === userId) {
		return {
			pagador,
			canEdit: true,
			share: null as typeof compartilhamentosPagador.$inferSelect | null,
		};
	}

	const share = await db.query.compartilhamentosPagador.findFirst({
		where: and(
			eq(compartilhamentosPagador.pagadorId, pagadorId),
			eq(compartilhamentosPagador.sharedWithUserId, userId),
		),
	});

	if (!share) {
		return null;
	}

	return { pagador, canEdit: false, share };
}
