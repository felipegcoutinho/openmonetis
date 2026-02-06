import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { cartoes, contas, lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type RecentTransaction = {
	id: string;
	name: string;
	amount: number;
	purchaseDate: Date;
	cardLogo: string | null;
	accountLogo: string | null;
};

export type RecentTransactionsData = {
	transactions: RecentTransaction[];
};

export async function fetchRecentTransactions(
	userId: string,
	period: string,
): Promise<RecentTransactionsData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { transactions: [] };
	}

	const results = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			purchaseDate: lancamentos.purchaseDate,
			cardLogo: cartoes.logo,
			accountLogo: contas.logo,
			note: lancamentos.note,
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
		.orderBy(desc(lancamentos.purchaseDate), desc(lancamentos.createdAt))
		.limit(5);

	const transactions = results.map((row): RecentTransaction => {
		return {
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			purchaseDate: row.purchaseDate,
			cardLogo: row.cardLogo,
			accountLogo: row.accountLogo,
		};
	});

	return {
		transactions,
	};
}
