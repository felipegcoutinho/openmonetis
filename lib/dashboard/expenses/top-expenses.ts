import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { cartoes, contas, lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type TopExpense = {
	id: string;
	name: string;
	amount: number;
	purchaseDate: Date;
	paymentMethod: string;
	logo?: string | null;
};

export type TopExpensesData = {
	expenses: TopExpense[];
};

export async function fetchTopExpenses(
	userId: string,
	period: string,
	cardOnly: boolean = false,
): Promise<TopExpensesData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { expenses: [] };
	}

	const conditions = [
		eq(lancamentos.userId, userId),
		eq(lancamentos.period, period),
		eq(lancamentos.transactionType, "Despesa"),
		eq(lancamentos.pagadorId, adminPagadorId),
		or(
			isNull(lancamentos.note),
			and(
				sql`${lancamentos.note} != ${INITIAL_BALANCE_NOTE}`,
				sql`${
					lancamentos.note
				} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
			),
		),
	];

	// Se cardOnly for true, filtra apenas pagamentos com cartão
	if (cardOnly) {
		conditions.push(eq(lancamentos.paymentMethod, "Cartão de Crédito"));
	}

	const results = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			purchaseDate: lancamentos.purchaseDate,
			paymentMethod: lancamentos.paymentMethod,
			cartaoId: lancamentos.cartaoId,
			contaId: lancamentos.contaId,
			cardLogo: cartoes.logo,
			accountLogo: contas.logo,
		})
		.from(lancamentos)
		.leftJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(and(...conditions))
		.orderBy(asc(lancamentos.amount))
		.limit(10);

	const expenses = results.map(
		(row): TopExpense => ({
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			purchaseDate: row.purchaseDate,
			paymentMethod: row.paymentMethod,
			logo: row.cardLogo ?? row.accountLogo ?? null,
		}),
	);

	return {
		expenses,
	};
}
