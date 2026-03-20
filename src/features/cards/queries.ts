import { and, eq, ilike, isNull, ne, not, or, sql } from "drizzle-orm";
import { cards, financialAccounts, transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { loadLogoOptions } from "@/shared/lib/logo/options";

export type CardData = {
	id: string;
	name: string;
	brand: string;
	status: string;
	closingDay: string;
	dueDay: string;
	note: string | null;
	logo: string | null;
	limit: number | null;
	limitInUse: number;
	limitAvailable: number | null;
	accountId: string;
	accountName: string;
};

export type AccountSimple = {
	id: string;
	name: string;
	logo: string | null;
};

async function fetchCardsByStatus(
	userId: string,
	archived: boolean,
): Promise<{
	cards: CardData[];
	accounts: AccountSimple[];
	logoOptions: string[];
}> {
	const [cardRows, accountRows, logoOptions, usageRows] = await Promise.all([
		db.query.cards.findMany({
			orderBy: (table, { desc }) => [desc(table.name)],
			where: and(
				eq(cards.userId, userId),
				archived
					? ilike(cards.status, "inativo")
					: not(ilike(cards.status, "inativo")),
			),
			with: {
				financialAccount: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		}),
		db.query.financialAccounts.findMany({
			orderBy: (table, { desc }) => [desc(table.name)],
			where: eq(financialAccounts.userId, userId),
			columns: {
				id: true,
				name: true,
				logo: true,
			},
		}),
		loadLogoOptions(),
		db
			.select({
				cardId: transactions.cardId,
				total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					or(isNull(transactions.isSettled), eq(transactions.isSettled, false)),
					// Recorrente no cartão: só consome limite quando a data da ocorrência já passou
					or(
						ne(transactions.condition, "Recorrente"),
						sql`${transactions.purchaseDate} <= current_date`,
					),
				),
			)
			.groupBy(transactions.cardId),
	]);

	const usageMap = new Map<string, number>();
	usageRows.forEach((row: { cardId: string | null; total: number | null }) => {
		if (!row.cardId) return;
		usageMap.set(row.cardId, Number(row.total ?? 0));
	});

	const cardList = cardRows.map((card) => ({
		id: card.id,
		name: card.name,
		brand: card.brand ?? "",
		status: card.status ?? "",
		closingDay: card.closingDay,
		dueDay: card.dueDay,
		note: card.note,
		logo: card.logo,
		limit: card.limit ? Number(card.limit) : null,
		limitInUse: (() => {
			const total = usageMap.get(card.id) ?? 0;
			return total < 0 ? Math.abs(total) : 0;
		})(),
		limitAvailable: (() => {
			if (!card.limit) {
				return null;
			}
			const total = usageMap.get(card.id) ?? 0;
			const inUse = total < 0 ? Math.abs(total) : 0;
			return Math.max(Number(card.limit) - inUse, 0);
		})(),
		accountId: card.accountId,
		accountName:
			(card.financialAccount as { name?: string } | null)?.name ??
			"Conta não encontrada",
	}));

	const accounts = accountRows.map((account) => ({
		id: account.id,
		name: account.name,
		logo: account.logo,
	}));

	return { cards: cardList, accounts, logoOptions };
}

export async function fetchCardsForUser(userId: string): Promise<{
	cards: CardData[];
	accounts: AccountSimple[];
	logoOptions: string[];
}> {
	return fetchCardsByStatus(userId, false);
}

export async function fetchInactiveForUser(userId: string): Promise<{
	cards: CardData[];
	accounts: AccountSimple[];
	logoOptions: string[];
}> {
	return fetchCardsByStatus(userId, true);
}

export async function fetchAllCardsForUser(userId: string): Promise<{
	activeCards: CardData[];
	archivedCards: CardData[];
	accounts: AccountSimple[];
	logoOptions: string[];
}> {
	const [activeData, archivedData] = await Promise.all([
		fetchCardsForUser(userId),
		fetchInactiveForUser(userId),
	]);

	return {
		activeCards: activeData.cards,
		archivedCards: archivedData.cards,
		accounts: activeData.accounts,
		logoOptions: activeData.logoOptions,
	};
}
