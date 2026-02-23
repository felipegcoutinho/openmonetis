import { and, eq, ilike, isNull, ne, not, or, sql } from "drizzle-orm";
import { cartoes, contas, lancamentos } from "@/db/schema";
import { db } from "@/lib/db";
import { loadLogoOptions } from "@/lib/logo/options";

export type CardData = {
	id: string;
	name: string;
	brand: string | null;
	status: string | null;
	closingDay: number;
	dueDay: number;
	note: string | null;
	logo: string | null;
	limit: number | null;
	limitInUse: number;
	limitAvailable: number | null;
	contaId: string;
	contaName: string;
};

export type AccountSimple = {
	id: string;
	name: string;
	logo: string | null;
};

export async function fetchCardsForUser(userId: string): Promise<{
	cards: CardData[];
	accounts: AccountSimple[];
	logoOptions: LogoOption[];
}> {
	const [cardRows, accountRows, logoOptions, usageRows] = await Promise.all([
		db.query.cartoes.findMany({
			orderBy: (
				card: typeof cartoes.$inferSelect,
				{ desc }: { desc: (field: unknown) => unknown },
			) => [desc(card.name)],
			where: and(
				eq(cartoes.userId, userId),
				not(ilike(cartoes.status, "inativo")),
			),
			with: {
				conta: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		}),
		db.query.contas.findMany({
			orderBy: (
				account: typeof contas.$inferSelect,
				{ desc }: { desc: (field: unknown) => unknown },
			) => [desc(account.name)],
			where: eq(contas.userId, userId),
			columns: {
				id: true,
				name: true,
				logo: true,
			},
		}),
		loadLogoOptions(),
		db
			.select({
				cartaoId: lancamentos.cartaoId,
				total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.where(
				and(
					eq(lancamentos.userId, userId),
					or(isNull(lancamentos.isSettled), eq(lancamentos.isSettled, false)),
					// Recorrente no cartão: só consome limite quando a data da ocorrência já passou
					or(
						ne(lancamentos.condition, "Recorrente"),
						sql`${lancamentos.purchaseDate} <= current_date`,
					),
				),
			)
			.groupBy(lancamentos.cartaoId),
	]);

	const usageMap = new Map<string, number>();
	usageRows.forEach(
		(row: { cartaoId: string | null; total: number | null }) => {
			if (!row.cartaoId) return;
			usageMap.set(row.cartaoId, Number(row.total ?? 0));
		},
	);

	const cards = cardRows.map((card) => ({
		id: card.id,
		name: card.name,
		brand: card.brand,
		status: card.status,
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
		contaId: card.contaId,
		contaName: card.conta?.name ?? "Conta não encontrada",
	}));

	const accounts = accountRows.map((account) => ({
		id: account.id,
		name: account.name,
		logo: account.logo,
	}));

	return { cards, accounts, logoOptions };
}

export async function fetchInativosForUser(userId: string): Promise<{
	cards: CardData[];
	accounts: AccountSimple[];
	logoOptions: LogoOption[];
}> {
	const [cardRows, accountRows, logoOptions, usageRows] = await Promise.all([
		db.query.cartoes.findMany({
			orderBy: (
				card: typeof cartoes.$inferSelect,
				{ desc }: { desc: (field: unknown) => unknown },
			) => [desc(card.name)],
			where: and(eq(cartoes.userId, userId), ilike(cartoes.status, "inativo")),
			with: {
				conta: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		}),
		db.query.contas.findMany({
			orderBy: (
				account: typeof contas.$inferSelect,
				{ desc }: { desc: (field: unknown) => unknown },
			) => [desc(account.name)],
			where: eq(contas.userId, userId),
			columns: {
				id: true,
				name: true,
				logo: true,
			},
		}),
		loadLogoOptions(),
		db
			.select({
				cartaoId: lancamentos.cartaoId,
				total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.where(
				and(
					eq(lancamentos.userId, userId),
					or(isNull(lancamentos.isSettled), eq(lancamentos.isSettled, false)),
					or(
						ne(lancamentos.condition, "Recorrente"),
						sql`${lancamentos.purchaseDate} <= current_date`,
					),
				),
			)
			.groupBy(lancamentos.cartaoId),
	]);

	const usageMap = new Map<string, number>();
	usageRows.forEach(
		(row: { cartaoId: string | null; total: number | null }) => {
			if (!row.cartaoId) return;
			usageMap.set(row.cartaoId, Number(row.total ?? 0));
		},
	);

	const cards = cardRows.map((card) => ({
		id: card.id,
		name: card.name,
		brand: card.brand,
		status: card.status,
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
		contaId: card.contaId,
		contaName: card.conta?.name ?? "Conta não encontrada",
	}));

	const accounts = accountRows.map((account) => ({
		id: account.id,
		name: account.name,
		logo: account.logo,
	}));

	return { cards, accounts, logoOptions };
}

export async function fetchAllCardsForUser(userId: string): Promise<{
	activeCards: CardData[];
	archivedCards: CardData[];
	accounts: AccountSimple[];
	logoOptions: LogoOption[];
}> {
	const [activeData, archivedData] = await Promise.all([
		fetchCardsForUser(userId),
		fetchInativosForUser(userId),
	]);

	return {
		activeCards: activeData.cards,
		archivedCards: archivedData.cards,
		accounts: activeData.accounts,
		logoOptions: activeData.logoOptions,
	};
}
