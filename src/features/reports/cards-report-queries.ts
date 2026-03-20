import {
	and,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	ne,
	not,
	or,
	sum,
} from "drizzle-orm";
import { cards, categories, invoices, transactions } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { formatDateOnly } from "@/shared/utils/date";
import { safeToNumber } from "@/shared/utils/number";
import {
	buildPeriodWindow,
	formatCompactPeriodLabel,
	getPreviousPeriod,
} from "@/shared/utils/period";

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

type CardRow = {
	id: string;
	name: string;
	brand: string | null;
	logo: string | null;
	limit: unknown;
	status: string;
};

type CardUsageRow = {
	cardId: string | null;
	totalAmount: unknown;
};

type MonthlyUsageRow = {
	period: string;
	totalAmount: unknown;
};

type CategoryAmountRow = {
	categoryId: string | null;
	totalAmount: unknown;
};

type CategoryInfoRow = {
	id: string;
	name: string;
	icon: string | null;
};

type TopExpenseRow = {
	id: string;
	name: string;
	amount: unknown;
	purchaseDate: Date | string | null;
	categoryId: string | null;
};

type InvoiceStatusRow = {
	period: string;
	status: string | null;
};

export async function fetchCartoesReportData(
	userId: string,
	currentPeriod: string,
	selectedCartaoId?: string | null,
): Promise<CartoesReportData> {
	const previousPeriod = getPreviousPeriod(currentPeriod);

	// Fetch all active cards (not inactive)
	const allCards = (await db
		.select({
			id: cards.id,
			name: cards.name,
			brand: cards.brand,
			logo: cards.logo,
			limit: cards.limit,
			status: cards.status,
		})
		.from(cards)
		.where(
			and(eq(cards.userId, userId), not(ilike(cards.status, "inativo"))),
		)) as CardRow[];

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
	const adminPayerId = await getAdminPayerId(userId);

	// Fetch current period usage by card (recorrente só conta quando a data da ocorrência já passou)
	const currentUsageData = adminPayerId
		? ((await db
				.select({
					cardId: transactions.cardId,
					totalAmount: sum(transactions.amount).as("total"),
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.period, currentPeriod),
						eq(transactions.payerId, adminPayerId),
						eq(transactions.transactionType, DESPESA),
						inArray(transactions.cardId, cardIds),
						or(
							ne(transactions.condition, "Recorrente"),
							lte(transactions.purchaseDate, new Date()),
						),
					),
				)
				.groupBy(transactions.cardId)) as CardUsageRow[])
		: [];

	// Fetch previous period usage by card
	const previousUsageData = adminPayerId
		? ((await db
				.select({
					cardId: transactions.cardId,
					totalAmount: sum(transactions.amount).as("total"),
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.period, previousPeriod),
						eq(transactions.payerId, adminPayerId),
						eq(transactions.transactionType, DESPESA),
						inArray(transactions.cardId, cardIds),
					),
				)
				.groupBy(transactions.cardId)) as CardUsageRow[])
		: [];

	const currentUsageMap = new Map<string, number>();
	for (const row of currentUsageData) {
		if (row.cardId) {
			currentUsageMap.set(row.cardId, Math.abs(safeToNumber(row.totalAmount)));
		}
	}

	const previousUsageMap = new Map<string, number>();
	for (const row of previousUsageData) {
		if (row.cardId) {
			previousUsageMap.set(row.cardId, Math.abs(safeToNumber(row.totalAmount)));
		}
	}

	// Build card summaries
	const cardSummaries: CardSummary[] = allCards.map((card) => {
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

	// Sort cardSummaries by usage (descending)
	cardSummaries.sort((a, b) => b.currentUsage - a.currentUsage);

	// Calculate totals
	const totalLimit = cardSummaries.reduce((acc, c) => acc + c.limit, 0);
	const totalUsage = cardSummaries.reduce((acc, c) => acc + c.currentUsage, 0);
	const totalUsagePercent =
		totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

	// Fetch selected card details if provided
	let selectedCard: CardDetailData | null = null;
	const targetCardId =
		selectedCartaoId || (cardSummaries.length > 0 ? cardSummaries[0].id : null);

	if (targetCardId) {
		const cardSummary = cardSummaries.find((c) => c.id === targetCardId);
		if (cardSummary) {
			selectedCard = await fetchCardDetail(
				userId,
				targetCardId,
				cardSummary,
				currentPeriod,
				adminPayerId,
			);
		}
	}

	return {
		cards: cardSummaries,
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
	adminPayerId: string | null,
): Promise<CardDetailData> {
	// Build period range for last 12 months
	const periods = buildPeriodWindow(currentPeriod, 12);

	const startPeriod = periods[0];

	// Fetch monthly usage
	const monthlyData = adminPayerId
		? ((await db
				.select({
					period: transactions.period,
					totalAmount: sum(transactions.amount).as("total"),
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.cardId, cardId),
						gte(transactions.period, startPeriod),
						lte(transactions.period, currentPeriod),
						eq(transactions.payerId, adminPayerId),
						eq(transactions.transactionType, DESPESA),
					),
				)
				.groupBy(transactions.period)
				.orderBy(transactions.period)) as MonthlyUsageRow[])
		: [];

	const monthlyUsage = periods.map((period) => {
		const data = monthlyData.find((d) => d.period === period);
		return {
			period,
			periodLabel: formatCompactPeriodLabel(period),
			amount: Math.abs(safeToNumber(data?.totalAmount)),
		};
	});

	// Fetch category breakdown for current period
	const categoryData = adminPayerId
		? ((await db
				.select({
					categoryId: transactions.categoryId,
					totalAmount: sum(transactions.amount).as("total"),
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.cardId, cardId),
						eq(transactions.period, currentPeriod),
						eq(transactions.payerId, adminPayerId),
						eq(transactions.transactionType, DESPESA),
					),
				)
				.groupBy(transactions.categoryId)) as CategoryAmountRow[])
		: [];

	// Fetch category names
	const categoryIds = categoryData
		.map((c) => c.categoryId)
		.filter((id): id is string => id !== null);

	const categoryNames =
		categoryIds.length > 0
			? ((await db
					.select({
						id: categories.id,
						name: categories.name,
						icon: categories.icon,
					})
					.from(categories)
					.where(inArray(categories.id, categoryIds))) as CategoryInfoRow[])
			: ([] as CategoryInfoRow[]);

	const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c]));

	const totalCategoryAmount = categoryData.reduce(
		(acc, c) => acc + Math.abs(safeToNumber(c.totalAmount)),
		0,
	);

	const categoryBreakdown = categoryData
		.map((cat) => {
			const amount = Math.abs(safeToNumber(cat.totalAmount));
			const catInfo = cat.categoryId
				? categoryNameMap.get(cat.categoryId)
				: null;
			return {
				id: cat.categoryId || "sem-categoria",
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
	const topExpensesData = adminPayerId
		? ((await db
				.select({
					id: transactions.id,
					name: transactions.name,
					amount: transactions.amount,
					purchaseDate: transactions.purchaseDate,
					categoryId: transactions.categoryId,
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.cardId, cardId),
						eq(transactions.period, currentPeriod),
						eq(transactions.payerId, adminPayerId),
						eq(transactions.transactionType, DESPESA),
					),
				)
				.orderBy(transactions.amount)
				.limit(10)) as TopExpenseRow[])
		: [];

	const topExpenses = topExpensesData.map((expense) => {
		const catInfo = expense.categoryId
			? categoryNameMap.get(expense.categoryId)
			: null;
		return {
			id: expense.id,
			name: expense.name,
			amount: Math.abs(safeToNumber(expense.amount)),
			date:
				formatDateOnly(expense.purchaseDate, {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
				}) ?? "",
			category: catInfo?.name || null,
		};
	});

	// Fetch invoice status for last 6 months
	const invoiceData = (await db
		.select({
			period: invoices.period,
			status: invoices.paymentStatus,
		})
		.from(invoices)
		.where(
			and(
				eq(invoices.userId, userId),
				eq(invoices.cardId, cardId),
				gte(invoices.period, startPeriod),
				lte(invoices.period, currentPeriod),
			),
		)
		.orderBy(invoices.period)) as InvoiceStatusRow[];

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
