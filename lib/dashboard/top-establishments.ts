import { and, eq, isNull, or, sql } from "drizzle-orm";
import { cartoes, contas, lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type TopEstablishment = {
	id: string;
	name: string;
	amount: number;
	occurrences: number;
	logo: string | null;
};

export type TopEstablishmentsData = {
	establishments: TopEstablishment[];
};

const shouldIncludeEstablishment = (name: string) => {
	const normalized = name.trim().toLowerCase();

	if (normalized === "saldo inicial") {
		return false;
	}

	if (normalized.includes("fatura")) {
		return false;
	}

	return true;
};

export async function fetchTopEstablishments(
	userId: string,
	period: string,
): Promise<TopEstablishmentsData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { establishments: [] };
	}

	const rows = await db
		.select({
			name: lancamentos.name,
			totalAmount: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			occurrences: sql<number>`count(${lancamentos.id})`,
			logo: sql<string | null>`max(coalesce(${cartoes.logo}, ${contas.logo}))`,
		})
		.from(lancamentos)
		.leftJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(lancamentos.pagadorId, adminPagadorId),
				or(
					isNull(lancamentos.note),
					and(
						sql`${lancamentos.note} != ${INITIAL_BALANCE_NOTE}`,
						sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			),
		)
		.groupBy(lancamentos.name)
		.orderBy(sql`ABS(sum(${lancamentos.amount})) DESC`)
		.limit(10);

	const establishments = rows
		.filter((row) => shouldIncludeEstablishment(row.name))
		.map(
			(row): TopEstablishment => ({
				id: row.name,
				name: row.name,
				amount: Math.abs(toNumber(row.totalAmount)),
				occurrences: Number(row.occurrences ?? 0),
				logo: row.logo ?? null,
			}),
		);

	return {
		establishments,
	};
}
