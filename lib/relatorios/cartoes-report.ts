import { and, eq, gte, ilike, inArray, lte, ne, not, or, sql, sum } from "drizzle-orm";
import {
	cartoes,
	categorias,
	faturas,
	lancamentos,
	pagadores,
} from "@/db/schema";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { safeToNumber } from "@/lib/utils/number";
import { getPreviousPeriod } from "@/lib/utils/period";

const DESPESA = "Despesa";

export type CardSummary = {
	id: string;
	name: string;
	brand: string | null;
	logo: string | null;
	limit: number;
	currentUsage: number;
	usagePercent: number;
	previousUsage: number;
	changePercent: number;
	trend: "up" | "down" | "stable";
	status: string;
};

export type CardDetailData = {
	card: CardSummary;
	monthlyUsage: {
		period: string;
		periodLabel: string;
		amount: number;
	}[];
	categoryBreakdown: {
		id: string;
		name: string;
		icon: string | null;
		amount: number;
		percent: number;
	}[];
	topExpenses: {
		id: string;
		name: string;
		amount: number;
		date: string;
		category: string | null;
	}[];
	invoiceStatus: {
		period: string;
		status: string | null;
		amount: number;
	}[];
};

export type CartoesReportData = {
	cards: CardSummary[];
	totalLimit: number;
	totalUsage: number;
	totalUsagePercent: number;
	selectedCard: CardDetailData | null;
};

export async function fetchCartoesReportData(
	userId: string,
	currentPeriod: string,
	selectedCartaoId?: string | null,
): Promise<CartoesReportData> {
	const previousPeriod = getPreviousPeriod(currentPeriod);

	// Fetch all active cards (not inactive)
	const allCards = await db
		.select({
			id: cartoes.id,
			name: cartoes.name,
			brand: cartoes.brand,
			logo: cartoes.logo,
			limit: cartoes.limit,
			status: cartoes.status,
		})
		.from(cartoes)
		.where(
			and(eq(cartoes.userId, userId), not(ilike(cartoes.status, "inativo"))),
		);

	if (allCards.length === 0) {
		return {
			cards: [],
			totalLimit: 0,
			totalUsage: 0,
			totalUsagePercent: 0,
			selectedCard: null,
		};
	}

	const cardIds = allCards.map((c) => c.id);

	// Fetch current period usage by card (recorrente só conta quando a data da ocorrência já passou)
	const currentUsageData = await db
		.select({
			cartaoId: lancamentos.cartaoId,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
				inArray(lancamentos.cartaoId, cardIds),
				or(
					ne(lancamentos.condition, "Recorrente"),
					sql`${lancamentos.purchaseDate} <= current_date`,
				),
			),
		)
		.groupBy(lancamentos.cartaoId);

	// Fetch previous period usage by card
	const previousUsageData = await db
		.select({
			cartaoId: lancamentos.cartaoId,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, previousPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
				inArray(lancamentos.cartaoId, cardIds),
			),
		)
		.groupBy(lancamentos.cartaoId);

	const currentUsageMap = new Map<string, number>();
	for (const row of currentUsageData) {
		if (row.cartaoId) {
			currentUsageMap.set(
				row.cartaoId,
				Math.abs(safeToNumber(row.totalAmount)),
			);
		}
	}

	const previousUsageMap = new Map<string, number>();
	for (const row of previousUsageData) {
		if (row.cartaoId) {
			previousUsageMap.set(
				row.cartaoId,
				Math.abs(safeToNumber(row.totalAmount)),
			);
		}
	}

	// Build card summaries
	const cards: CardSummary[] = allCards.map((card) => {
		const limit = safeToNumber(card.limit);
		const currentUsage = currentUsageMap.get(card.id) || 0;
		const previousUsage = previousUsageMap.get(card.id) || 0;
		const usagePercent = limit > 0 ? (currentUsage / limit) * 100 : 0;

		let changePercent = 0;
		let trend: "up" | "down" | "stable" = "stable";
		if (previousUsage > 0) {
			changePercent = ((currentUsage - previousUsage) / previousUsage) * 100;
			if (changePercent > 5) trend = "up";
			else if (changePercent < -5) trend = "down";
		} else if (currentUsage > 0) {
			changePercent = 100;
			trend = "up";
		}

		return {
			id: card.id,
			name: card.name,
			brand: card.brand,
			logo: card.logo,
			limit,
			currentUsage,
			usagePercent,
			previousUsage,
			changePercent,
			trend,
			status: card.status,
		};
	});

	// Sort cards by usage (descending)
	cards.sort((a, b) => b.currentUsage - a.currentUsage);

	// Calculate totals
	const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);
	const totalUsage = cards.reduce((acc, c) => acc + c.currentUsage, 0);
	const totalUsagePercent =
		totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

	// Fetch selected card details if provided
	let selectedCard: CardDetailData | null = null;
	const targetCardId =
		selectedCartaoId || (cards.length > 0 ? cards[0].id : null);

	if (targetCardId) {
		const cardSummary = cards.find((c) => c.id === targetCardId);
		if (cardSummary) {
			selectedCard = await fetchCardDetail(
				userId,
				targetCardId,
				cardSummary,
				currentPeriod,
			);
		}
	}

	return {
		cards,
		totalLimit,
		totalUsage,
		totalUsagePercent,
		selectedCard,
	};
}

async function fetchCardDetail(
	userId: string,
	cardId: string,
	cardSummary: CardSummary,
	currentPeriod: string,
): Promise<CardDetailData> {
	// Build period range for last 12 months
	const periods: string[] = [];
	let p = currentPeriod;
	for (let i = 0; i < 12; i++) {
		periods.unshift(p);
		p = getPreviousPeriod(p);
	}

	const startPeriod = periods[0];

	const monthLabels = [
		"Jan",
		"Fev",
		"Mar",
		"Abr",
		"Mai",
		"Jun",
		"Jul",
		"Ago",
		"Set",
		"Out",
		"Nov",
		"Dez",
	];

	// Fetch monthly usage
	const monthlyData = await db
		.select({
			period: lancamentos.period,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.cartaoId, cardId),
				gte(lancamentos.period, startPeriod),
				lte(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
			),
		)
		.groupBy(lancamentos.period)
		.orderBy(lancamentos.period);

	const monthlyUsage = periods.map((period) => {
		const data = monthlyData.find((d) => d.period === period);
		const [year, month] = period.split("-");
		return {
			period,
			periodLabel: `${monthLabels[parseInt(month, 10) - 1]}/${year.slice(2)}`,
			amount: Math.abs(safeToNumber(data?.totalAmount)),
		};
	});

	// Fetch category breakdown for current period
	const categoryData = await db
		.select({
			categoriaId: lancamentos.categoriaId,
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.cartaoId, cardId),
				eq(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
			),
		)
		.groupBy(lancamentos.categoriaId);

	// Fetch category names
	const categoryIds = categoryData
		.map((c) => c.categoriaId)
		.filter((id): id is string => id !== null);

	const categoryNames =
		categoryIds.length > 0
			? await db
					.select({
						id: categorias.id,
						name: categorias.name,
						icon: categorias.icon,
					})
					.from(categorias)
					.where(inArray(categorias.id, categoryIds))
			: [];

	const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c]));

	const totalCategoryAmount = categoryData.reduce(
		(acc, c) => acc + Math.abs(safeToNumber(c.totalAmount)),
		0,
	);

	const categoryBreakdown = categoryData
		.map((cat) => {
			const amount = Math.abs(safeToNumber(cat.totalAmount));
			const catInfo = cat.categoriaId
				? categoryNameMap.get(cat.categoriaId)
				: null;
			return {
				id: cat.categoriaId || "sem-categoria",
				name: catInfo?.name || "Sem categoria",
				icon: catInfo?.icon || null,
				amount,
				percent:
					totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0,
			};
		})
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 10);

	// Fetch top expenses for current period
	const topExpensesData = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			purchaseDate: lancamentos.purchaseDate,
			categoriaId: lancamentos.categoriaId,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.cartaoId, cardId),
				eq(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
			),
		)
		.orderBy(lancamentos.amount)
		.limit(10);

	const topExpenses = topExpensesData.map((expense) => {
		const catInfo = expense.categoriaId
			? categoryNameMap.get(expense.categoriaId)
			: null;
		return {
			id: expense.id,
			name: expense.name,
			amount: Math.abs(safeToNumber(expense.amount)),
			date: expense.purchaseDate
				? new Date(expense.purchaseDate).toLocaleDateString("pt-BR")
				: "",
			category: catInfo?.name || null,
		};
	});

	// Fetch invoice status for last 6 months
	const invoiceData = await db
		.select({
			period: faturas.period,
			status: faturas.paymentStatus,
		})
		.from(faturas)
		.where(
			and(
				eq(faturas.userId, userId),
				eq(faturas.cartaoId, cardId),
				gte(faturas.period, startPeriod),
				lte(faturas.period, currentPeriod),
			),
		)
		.orderBy(faturas.period);

	const invoiceStatus = periods.map((period) => {
		const invoice = invoiceData.find((i) => i.period === period);
		const usage = monthlyUsage.find((m) => m.period === period);
		return {
			period,
			status: invoice?.status || null,
			amount: usage?.amount || 0,
		};
	});

	return {
		card: cardSummary,
		monthlyUsage,
		categoryBreakdown,
		topExpenses,
		invoiceStatus,
	};
}
