"use server";

import { and, eq, lt, ne, sql } from "drizzle-orm";
import {
	cartoes,
	categorias,
	faturas,
	lancamentos,
	orcamentos,
} from "@/db/schema";
import { db } from "@/lib/db";
import { INVOICE_PAYMENT_STATUS } from "@/lib/faturas";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";
import {
	buildDateOnlyStringFromPeriodDay,
	getBusinessDateString,
	isDateOnlyPast,
	isDateOnlyWithinDays,
	toDateOnlyString,
} from "@/lib/utils/date";
import { safeToNumber as toNumber } from "@/lib/utils/number";

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

	const adminPagadorId = await getAdminPagadorId(userId);

	// --- Faturas atrasadas (períodos anteriores) ---
	const overdueInvoices = await db
		.select({
			invoiceId: faturas.id,
			cardId: cartoes.id,
			cardName: cartoes.name,
			cardLogo: cartoes.logo,
			dueDay: cartoes.dueDay,
			period: faturas.period,
			totalAmount: sql<number | null>`
        COALESCE(
          (SELECT SUM(${lancamentos.amount})
           FROM ${lancamentos}
           WHERE ${lancamentos.cartaoId} = ${cartoes.id}
             AND ${lancamentos.period} = ${faturas.period}
             AND ${lancamentos.userId} = ${faturas.userId}),
          0
        )
      `,
		})
		.from(faturas)
		.innerJoin(cartoes, eq(faturas.cartaoId, cartoes.id))
		.where(
			and(
				eq(faturas.userId, userId),
				eq(faturas.paymentStatus, INVOICE_PAYMENT_STATUS.PENDING),
				lt(faturas.period, currentPeriod),
			),
		);

	// --- Faturas do período atual ---
	const currentInvoices = await db
		.select({
			invoiceId: faturas.id,
			cardId: cartoes.id,
			cardName: cartoes.name,
			cardLogo: cartoes.logo,
			dueDay: cartoes.dueDay,
			period: sql<string>`COALESCE(${faturas.period}, ${currentPeriod})`,
			paymentStatus: faturas.paymentStatus,
			totalAmount: sql<number | null>`
        COALESCE(SUM(${lancamentos.amount}), 0)
      `,
			transactionCount: sql<number | null>`COUNT(${lancamentos.id})`,
		})
		.from(cartoes)
		.leftJoin(
			faturas,
			and(
				eq(faturas.cartaoId, cartoes.id),
				eq(faturas.userId, userId),
				eq(faturas.period, currentPeriod),
			),
		)
		.leftJoin(
			lancamentos,
			and(
				eq(lancamentos.cartaoId, cartoes.id),
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, currentPeriod),
			),
		)
		.where(eq(cartoes.userId, userId))
		.groupBy(
			faturas.id,
			cartoes.id,
			cartoes.name,
			cartoes.logo,
			cartoes.dueDay,
			faturas.period,
			faturas.paymentStatus,
		);

	// --- Boletos não pagos ---
	const boletosConditions = [
		eq(lancamentos.userId, userId),
		eq(lancamentos.paymentMethod, PAYMENT_METHOD_BOLETO),
		eq(lancamentos.isSettled, false),
	];
	if (adminPagadorId) {
		boletosConditions.push(eq(lancamentos.pagadorId, adminPagadorId));
	}

	const boletosRows = await db
		.select({
			id: lancamentos.id,
			name: lancamentos.name,
			amount: lancamentos.amount,
			dueDate: lancamentos.dueDate,
			period: lancamentos.period,
		})
		.from(lancamentos)
		.where(and(...boletosConditions));

	// --- Orçamentos do período atual ---
	const budgetJoinConditions = [
		eq(lancamentos.categoriaId, orcamentos.categoriaId),
		eq(lancamentos.userId, orcamentos.userId),
		eq(lancamentos.period, orcamentos.period),
		eq(lancamentos.transactionType, "Despesa"),
		ne(lancamentos.condition, "cancelado"),
	];
	if (adminPagadorId) {
		budgetJoinConditions.push(eq(lancamentos.pagadorId, adminPagadorId));
	}

	const budgetRows = await db
		.select({
			orcamentoId: orcamentos.id,
			budgetAmount: orcamentos.amount,
			categoriaName: categorias.name,
			spentAmount: sql<number>`COALESCE(SUM(ABS(${lancamentos.amount})), 0)`,
		})
		.from(orcamentos)
		.innerJoin(categorias, eq(orcamentos.categoriaId, categorias.id))
		.leftJoin(lancamentos, and(...budgetJoinConditions))
		.where(
			and(eq(orcamentos.userId, userId), eq(orcamentos.period, currentPeriod)),
		)
		.groupBy(orcamentos.id, orcamentos.amount, categorias.name);

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
