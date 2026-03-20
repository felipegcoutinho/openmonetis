"use server";

import { and, eq, lt, ne, sql } from "drizzle-orm";
import {
	budgets,
	cards,
	categories,
	invoices,
	transactions,
} from "@/db/schema";
import { db } from "@/shared/lib/db";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import {
	buildDateOnlyStringFromPeriodDay,
	getBusinessDateString,
	isDateOnlyPast,
	isDateOnlyWithinDays,
	toDateOnlyString,
} from "@/shared/utils/date";
import { safeToNumber as toNumber } from "@/shared/utils/number";

export type NotificationType = "overdue" | "due_soon";

export type DashboardNotification = {
	id: string;
	type: "invoice" | "boleto";
	name: string;
	dueDate: string;
	status: NotificationType;
	amount: number;
	period?: string;
	showAmount: boolean;
	cardLogo?: string | null;
};

export type BudgetStatus = "exceeded" | "critical";

export type BudgetNotification = {
	id: string;
	categoryName: string;
	budgetAmount: number;
	spentAmount: number;
	usedPercentage: number;
	status: BudgetStatus;
};

export type DashboardNotificationsSnapshot = {
	notifications: DashboardNotification[];
	totalCount: number;
	budgetNotifications: BudgetNotification[];
};

const PAYMENT_METHOD_BOLETO = "Boleto";
const BUDGET_CRITICAL_THRESHOLD = 80;

/**
 * Busca todas as notificações do dashboard:
 * - Faturas de cartão atrasadas ou com vencimento próximo
 * - Boletos não pagos atrasados ou com vencimento próximo
 * - Orçamentos excedidos (≥ 100%) ou críticos (≥ 80%)
 */
export async function fetchDashboardNotifications(
	userId: string,
	currentPeriod: string,
): Promise<DashboardNotificationsSnapshot> {
	const today = getBusinessDateString();
	const DAYS_THRESHOLD = 5;

	const adminPayerId = await getAdminPayerId(userId);

	// --- Build conditions that depend on adminPayerId ---
	const boletosConditions = [
		eq(transactions.userId, userId),
		eq(transactions.paymentMethod, PAYMENT_METHOD_BOLETO),
		eq(transactions.isSettled, false),
	];
	if (adminPayerId) {
		boletosConditions.push(eq(transactions.payerId, adminPayerId));
	}

	const budgetJoinConditions = [
		eq(transactions.categoryId, budgets.categoryId),
		eq(transactions.userId, budgets.userId),
		eq(transactions.period, budgets.period),
		eq(transactions.transactionType, "Despesa"),
		ne(transactions.condition, "cancelado"),
	];
	if (adminPayerId) {
		budgetJoinConditions.push(eq(transactions.payerId, adminPayerId));
	}

	// --- All 4 queries are independent — run in parallel ---
	const [overdueInvoices, currentInvoices, boletosRows, budgetRows] =
		await Promise.all([
			// Faturas atrasadas (períodos anteriores)
			db
				.select({
					invoiceId: invoices.id,
					cardId: cards.id,
					cardName: cards.name,
					cardLogo: cards.logo,
					dueDay: cards.dueDay,
					period: invoices.period,
					totalAmount: sql<
						number | null
					>`COALESCE(SUM(${transactions.amount}), 0)`,
				})
				.from(invoices)
				.innerJoin(cards, eq(invoices.cardId, cards.id))
				.leftJoin(
					transactions,
					and(
						eq(transactions.cardId, invoices.cardId),
						eq(transactions.period, invoices.period),
						eq(transactions.userId, invoices.userId),
					),
				)
				.where(
					and(
						eq(invoices.userId, userId),
						eq(invoices.paymentStatus, INVOICE_PAYMENT_STATUS.PENDING),
						lt(invoices.period, currentPeriod),
					),
				)
				.groupBy(
					invoices.id,
					cards.id,
					cards.name,
					cards.logo,
					cards.dueDay,
					invoices.period,
				),
			// Faturas do período atual
			db
				.select({
					invoiceId: invoices.id,
					cardId: cards.id,
					cardName: cards.name,
					cardLogo: cards.logo,
					dueDay: cards.dueDay,
					period: sql<string>`COALESCE(${invoices.period}, ${currentPeriod})`,
					paymentStatus: invoices.paymentStatus,
					totalAmount: sql<number | null>`
				COALESCE(SUM(${transactions.amount}), 0)
			  `,
					transactionCount: sql<number | null>`COUNT(${transactions.id})`,
				})
				.from(cards)
				.leftJoin(
					invoices,
					and(
						eq(invoices.cardId, cards.id),
						eq(invoices.userId, userId),
						eq(invoices.period, currentPeriod),
					),
				)
				.leftJoin(
					transactions,
					and(
						eq(transactions.cardId, cards.id),
						eq(transactions.userId, userId),
						eq(transactions.period, currentPeriod),
					),
				)
				.where(eq(cards.userId, userId))
				.groupBy(
					invoices.id,
					cards.id,
					cards.name,
					cards.logo,
					cards.dueDay,
					invoices.period,
					invoices.paymentStatus,
				),
			// Boletos não pagos
			db
				.select({
					id: transactions.id,
					name: transactions.name,
					amount: transactions.amount,
					dueDate: transactions.dueDate,
					period: transactions.period,
				})
				.from(transactions)
				.where(and(...boletosConditions)),
			// Orçamentos do período atual
			db
				.select({
					orcamentoId: budgets.id,
					budgetAmount: budgets.amount,
					categoriaName: categories.name,
					spentAmount: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
				})
				.from(budgets)
				.innerJoin(categories, eq(budgets.categoryId, categories.id))
				.leftJoin(transactions, and(...budgetJoinConditions))
				.where(
					and(eq(budgets.userId, userId), eq(budgets.period, currentPeriod)),
				)
				.groupBy(budgets.id, budgets.amount, categories.name),
		]);

	// =====================
	// Processar notificações
	// =====================

	const notifications: DashboardNotification[] = [];

	// Faturas atrasadas (períodos anteriores)
	for (const invoice of overdueInvoices) {
		if (!invoice.period || !invoice.dueDay) continue;
		const dueDate = buildDateOnlyStringFromPeriodDay(
			invoice.period,
			invoice.dueDay,
		);
		if (!dueDate) continue;
		const amount = toNumber(invoice.totalAmount);
		const notificationId = invoice.invoiceId
			? `invoice-${invoice.invoiceId}`
			: `invoice-${invoice.cardId}-${invoice.period}`;

		notifications.push({
			id: notificationId,
			type: "invoice",
			name: invoice.cardName,
			dueDate,
			status: "overdue",
			amount: Math.abs(amount),
			period: invoice.period,
			showAmount: true,
			cardLogo: invoice.cardLogo,
		});
	}

	// Faturas do período atual
	for (const invoice of currentInvoices) {
		if (!invoice.period || !invoice.dueDay) continue;
		const dueDate = buildDateOnlyStringFromPeriodDay(
			invoice.period,
			invoice.dueDay,
		);
		if (!dueDate) continue;
		const amount = toNumber(invoice.totalAmount);
		const transactionCount = toNumber(invoice.transactionCount);
		const paymentStatus =
			invoice.paymentStatus ?? INVOICE_PAYMENT_STATUS.PENDING;

		const shouldInclude =
			transactionCount > 0 ||
			Math.abs(amount) > 0 ||
			invoice.invoiceId !== null;
		if (!shouldInclude) continue;
		if (paymentStatus === INVOICE_PAYMENT_STATUS.PAID) continue;

		const invoiceIsOverdue = isDateOnlyPast(dueDate, today);
		const invoiceIsDueSoon = isDateOnlyWithinDays(
			dueDate,
			DAYS_THRESHOLD,
			today,
		);
		if (!invoiceIsOverdue && !invoiceIsDueSoon) continue;

		const notificationId = invoice.invoiceId
			? `invoice-${invoice.invoiceId}`
			: `invoice-${invoice.cardId}-${invoice.period}`;

		notifications.push({
			id: notificationId,
			type: "invoice",
			name: invoice.cardName,
			dueDate,
			status: invoiceIsOverdue ? "overdue" : "due_soon",
			amount: Math.abs(amount),
			period: invoice.period,
			showAmount: invoiceIsOverdue,
			cardLogo: invoice.cardLogo,
		});
	}

	// Boletos
	for (const boleto of boletosRows) {
		const dueDate = toDateOnlyString(boleto.dueDate);
		if (!dueDate) continue;

		const boletoIsOverdue = isDateOnlyPast(dueDate, today);
		const boletoIsDueSoon = isDateOnlyWithinDays(
			dueDate,
			DAYS_THRESHOLD,
			today,
		);
		const isOldPeriod = boleto.period < currentPeriod;
		const isCurrentPeriod = boleto.period === currentPeriod;
		const amount = toNumber(boleto.amount);

		if (isOldPeriod) {
			notifications.push({
				id: `boleto-${boleto.id}`,
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: "overdue",
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: true,
			});
		} else if (isCurrentPeriod && (boletoIsOverdue || boletoIsDueSoon)) {
			notifications.push({
				id: `boleto-${boleto.id}`,
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: boletoIsOverdue ? "overdue" : "due_soon",
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: boletoIsOverdue,
			});
		}
	}

	// Ordenar: atrasados primeiro, depois por data de vencimento
	notifications.sort((a, b) => {
		if (a.status === "overdue" && b.status !== "overdue") return -1;
		if (a.status !== "overdue" && b.status === "overdue") return 1;
		return a.dueDate.localeCompare(b.dueDate);
	});

	// Orçamentos excedidos e críticos
	const budgetNotifications: BudgetNotification[] = [];

	for (const row of budgetRows) {
		const budgetAmount = toNumber(row.budgetAmount);
		const spentAmount = toNumber(row.spentAmount);
		if (budgetAmount <= 0) continue;

		const usedPercentage = (spentAmount / budgetAmount) * 100;
		if (usedPercentage < BUDGET_CRITICAL_THRESHOLD) continue;

		budgetNotifications.push({
			id: `budget-${row.orcamentoId}`,
			categoryName: row.categoriaName,
			budgetAmount,
			spentAmount,
			usedPercentage,
			status: usedPercentage >= 100 ? "exceeded" : "critical",
		});
	}

	// Excedidos primeiro, depois por percentual decrescente
	budgetNotifications.sort((a, b) => {
		if (a.status === "exceeded" && b.status !== "exceeded") return -1;
		if (a.status !== "exceeded" && b.status === "exceeded") return 1;
		return b.usedPercentage - a.usedPercentage;
	});

	return {
		notifications,
		totalCount: notifications.length,
		budgetNotifications,
	};
}
