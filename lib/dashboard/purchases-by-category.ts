import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { cartoes, categorias, contas, lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type CategoryOption = {
	id: string;
	name: string;
	type: string;
};

export type CategoryTransaction = {
	id: string;
	name: string;
	amount: number;
	purchaseDate: Date;
	logo: string | null;
};

export type PurchasesByCategoryData = {
	categories: CategoryOption[];
	transactionsByCategory: Record<string, CategoryTransaction[]>;
};

const shouldIncludeTransaction = (name: string) => {
	const normalized = name.trim().toLowerCase();

	if (normalized === "saldo inicial") {
		return false;
	}

	if (normalized.includes("fatura")) {
		return false;
	}

	return true;
};

export async function fetchPurchasesByCategory(
	userId: string,
	period: string,
): Promise<PurchasesByCategoryData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { categories: [], transactionsByCategory: {} };
	}

	const transactionsRows = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			purchaseDate: lancamentos.purchaseDate,
			categoryId: lancamentos.categoriaId,
			categoryName: categorias.name,
			categoryType: categorias.type,
			cardLogo: cartoes.logo,
			accountLogo: contas.logo,
		})
		.from(lancamentos)
		.innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
		.leftJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.pagadorId, adminPagadorId),
				inArray(categorias.type, ["despesa", "receita"]),
				or(
					isNull(lancamentos.note),
					and(
						sql`${lancamentos.note} != ${INITIAL_BALANCE_NOTE}`,
						sql`${
							lancamentos.note
						} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			),
		)
		.orderBy(desc(lancamentos.purchaseDate));

	const transactionsByCategory: Record<string, CategoryTransaction[]> = {};
	const categoriesMap = new Map<string, CategoryOption>();

	for (const row of transactionsRows) {
		const categoryId = row.categoryId;

		if (!categoryId) {
			continue;
		}

		if (!shouldIncludeTransaction(row.name)) {
			continue;
		}

		// Adiciona a categoria ao mapa se ainda não existir
		if (!categoriesMap.has(categoryId)) {
			categoriesMap.set(categoryId, {
				id: categoryId,
				name: row.categoryName,
				type: row.categoryType,
			});
		}

		const entry: CategoryTransaction = {
			id: row.id,
			name: row.name,
			amount: Math.abs(toNumber(row.amount)),
			purchaseDate: row.purchaseDate,
			logo: row.cardLogo ?? row.accountLogo ?? null,
		};

		if (!transactionsByCategory[categoryId]) {
			transactionsByCategory[categoryId] = [];
		}

		const categoryTransactions = transactionsByCategory[categoryId];
		if (categoryTransactions && categoryTransactions.length < 10) {
			categoryTransactions.push(entry);
		}
	}

	// Ordena as categorias: receitas primeiro, depois despesas (alfabeticamente dentro de cada tipo)
	const categories = Array.from(categoriesMap.values()).sort((a, b) => {
		// Receita vem antes de despesa
		if (a.type !== b.type) {
			return a.type === "receita" ? -1 : 1;
		}
		// Dentro do mesmo tipo, ordena alfabeticamente
		return a.name.localeCompare(b.name);
	});

	return {
		categories,
		transactionsByCategory,
	};
}
