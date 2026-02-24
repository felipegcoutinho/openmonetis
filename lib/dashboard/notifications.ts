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
 * Calcula a data de vencimento de uma fatura baseado no período e dia de vencimento
 * @param period Período no formato YYYY-MM
 * @param dueDay Dia do vencimento (1-31)
 * @returns Data de vencimento no formato YYYY-MM-DD
 */
function calculateDueDate(period: string, dueDay: string): string {
	const [year, month] = period.split("-");
	const yearNumber = Number(year);
	const monthNumber = Number(month);
	const hasValidMonth =
		Number.isInteger(yearNumber) &&
		Number.isInteger(monthNumber) &&
		monthNumber >= 1 &&
		monthNumber <= 12;

	const daysInMonth = hasValidMonth
		? new Date(yearNumber, monthNumber, 0).getDate()
		: null;

	const dueDayNumber = Number(dueDay);
	const hasValidDueDay = Number.isInteger(dueDayNumber) && dueDayNumber > 0;

	const clampedDay =
		hasValidMonth && hasValidDueDay && daysInMonth
			? Math.min(dueDayNumber, daysInMonth)
			: hasValidDueDay
				? dueDayNumber
				: null;

	const day = clampedDay
		? String(clampedDay).padStart(2, "0")
		: dueDay.padStart(2, "0");

	const normalizedMonth =
		hasValidMonth && month.length < 2 ? month.padStart(2, "0") : month;

	return `${year}-${normalizedMonth}-${day}`;
}

/**
 * Normaliza uma data para o início do dia em UTC (00:00:00)
 */
function normalizeDate(date: Date): Date {
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			0,
			0,
			0,
			0,
		),
	);
}

/**
 * Converte string "YYYY-MM-DD" para Date em UTC (evita problemas de timezone)
 */
function parseUTCDate(dateString: string): Date {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Verifica se uma data está atrasada (antes do dia atual, não incluindo hoje)
 */
function isOverdue(dueDate: string, today: Date): boolean {
	const due = parseUTCDate(dueDate);
	const dueNormalized = normalizeDate(due);
	return dueNormalized < today;
}

/**
 * Verifica se uma data vence nos próximos X dias (incluindo hoje)
 */
function isDueWithinDays(
	dueDate: string,
	today: Date,
	daysThreshold: number,
): boolean {
	const due = parseUTCDate(dueDate);
	const dueNormalized = normalizeDate(due);
	const limitDate = new Date(today);
	limitDate.setUTCDate(limitDate.getUTCDate() + daysThreshold);
	return dueNormalized >= today && dueNormalized <= limitDate;
}

function toNum(value: unknown): number {
	if (typeof value === "number") return value;
	return Number(value) || 0;
}

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
	const today = normalizeDate(new Date());
	const DAYS_THRESHOLD = 5;

	const adminPagadorId = await getAdminPagadorId(userId);

	// --- Faturas atrasadas (períodos anteriores) ---
	const overdueInvoices = await db
		.select({
			invoiceId: faturas.id,
			cardId: cartoes.id,
			cardName: cartoes.name,
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
		const dueDate = calculateDueDate(invoice.period, invoice.dueDay);
		const amount = toNum(invoice.totalAmount);
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
		});
	}

	// Faturas do período atual
	for (const invoice of currentInvoices) {
		if (!invoice.period || !invoice.dueDay) continue;
		const amount = toNum(invoice.totalAmount);
		const transactionCount = toNum(invoice.transactionCount);
		const paymentStatus =
			invoice.paymentStatus ?? INVOICE_PAYMENT_STATUS.PENDING;

		const shouldInclude =
			transactionCount > 0 ||
			Math.abs(amount) > 0 ||
			invoice.invoiceId !== null;
		if (!shouldInclude) continue;
		if (paymentStatus === INVOICE_PAYMENT_STATUS.PAID) continue;

		const dueDate = calculateDueDate(invoice.period, invoice.dueDay);
		const invoiceIsOverdue = isOverdue(dueDate, today);
		const invoiceIsDueSoon = isDueWithinDays(dueDate, today, DAYS_THRESHOLD);
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
		});
	}

	// Boletos
	for (const boleto of boletosRows) {
		if (!boleto.dueDate) continue;
		const dueDate =
			boleto.dueDate instanceof Date
				? `${boleto.dueDate.getUTCFullYear()}-${String(boleto.dueDate.getUTCMonth() + 1).padStart(2, "0")}-${String(boleto.dueDate.getUTCDate()).padStart(2, "0")}`
				: boleto.dueDate;

		const boletoIsOverdue = isOverdue(dueDate, today);
		const boletoIsDueSoon = isDueWithinDays(dueDate, today, DAYS_THRESHOLD);
		const isOldPeriod = boleto.period < currentPeriod;
		const isCurrentPeriod = boleto.period === currentPeriod;
		const amount = toNum(boleto.amount);

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
		const budgetAmount = toNum(row.budgetAmount);
		const spentAmount = toNum(row.spentAmount);
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
