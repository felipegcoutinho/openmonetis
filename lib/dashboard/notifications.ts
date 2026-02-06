"use server";

import { and, eq, lt, sql } from "drizzle-orm";
import { cartoes, faturas, lancamentos } from "@/db/schema";
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
	showAmount: boolean; // Controla se o valor deve ser exibido no card
};

export type DashboardNotificationsSnapshot = {
	notifications: DashboardNotification[];
	totalCount: number;
};

const PAYMENT_METHOD_BOLETO = "Boleto";

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
 * Exemplo: Se hoje é dia 4 e daysThreshold = 5, retorna true para datas de 4 a 8
 */
function isDueWithinDays(
	dueDate: string,
	today: Date,
	daysThreshold: number,
): boolean {
	const due = parseUTCDate(dueDate);
	const dueNormalized = normalizeDate(due);

	// Data limite: hoje + daysThreshold dias (em UTC)
	const limitDate = new Date(today);
	limitDate.setUTCDate(limitDate.getUTCDate() + daysThreshold);

	// Vence se está entre hoje (inclusive) e a data limite (inclusive)
	return dueNormalized >= today && dueNormalized <= limitDate;
}

/**
 * Busca todas as notificações do dashboard
 *
 * Regras:
 * - Períodos anteriores: TODOS os não pagos (sempre status "atrasado")
 * - Período atual: Itens atrasados + os que vencem nos próximos dias (sem mostrar valor)
 *
 * Status:
 * - "overdue": vencimento antes do dia atual (ou qualquer período anterior)
 * - "due_soon": vencimento no dia atual ou nos próximos dias
 */
export async function fetchDashboardNotifications(
	userId: string,
	currentPeriod: string,
): Promise<DashboardNotificationsSnapshot> {
	const today = normalizeDate(new Date());
	const DAYS_THRESHOLD = 5;

	const adminPagadorId = await getAdminPagadorId(userId);

	// Buscar faturas pendentes de períodos anteriores
	// Apenas faturas com registro na tabela (períodos antigos devem ter sido finalizados)
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

	// Buscar faturas do período atual
	// Usa LEFT JOIN para incluir cartões com lançamentos mesmo sem registro em faturas
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

	// Buscar boletos não pagos (usando pagadorId direto ao invés de JOIN)
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

	const notifications: DashboardNotification[] = [];

	// Processar faturas atrasadas (períodos anteriores)
	for (const invoice of overdueInvoices) {
		if (!invoice.period || !invoice.dueDay) continue;

		const dueDate = calculateDueDate(invoice.period, invoice.dueDay);
		const amount =
			typeof invoice.totalAmount === "number"
				? invoice.totalAmount
				: Number(invoice.totalAmount) || 0;

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
			showAmount: true, // Mostrar valor para itens de períodos anteriores
		});
	}

	// Processar faturas do período atual (atrasadas + vencimento iminente)
	for (const invoice of currentInvoices) {
		if (!invoice.period || !invoice.dueDay) continue;

		const amount =
			typeof invoice.totalAmount === "number"
				? invoice.totalAmount
				: Number(invoice.totalAmount) || 0;

		const transactionCount =
			typeof invoice.transactionCount === "number"
				? invoice.transactionCount
				: Number(invoice.transactionCount) || 0;

		const paymentStatus =
			invoice.paymentStatus ?? INVOICE_PAYMENT_STATUS.PENDING;

		// Ignora se não tem lançamentos e não tem registro de fatura
		const shouldInclude =
			transactionCount > 0 ||
			Math.abs(amount) > 0 ||
			invoice.invoiceId !== null;

		if (!shouldInclude) continue;

		// Ignora se já foi paga
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

	// Processar boletos
	for (const boleto of boletosRows) {
		if (!boleto.dueDate) continue;

		// Converter para string no formato YYYY-MM-DD (UTC)
		const dueDate =
			boleto.dueDate instanceof Date
				? `${boleto.dueDate.getUTCFullYear()}-${String(boleto.dueDate.getUTCMonth() + 1).padStart(2, "0")}-${String(boleto.dueDate.getUTCDate()).padStart(2, "0")}`
				: boleto.dueDate;

		const boletoIsOverdue = isOverdue(dueDate, today);
		const boletoIsDueSoon = isDueWithinDays(dueDate, today, DAYS_THRESHOLD);

		const isOldPeriod = boleto.period < currentPeriod;
		const isCurrentPeriod = boleto.period === currentPeriod;

		// Período anterior: incluir todos (sempre atrasado)
		if (isOldPeriod) {
			const amount =
				typeof boleto.amount === "number"
					? boleto.amount
					: Number(boleto.amount) || 0;

			notifications.push({
				id: `boleto-${boleto.id}`,
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: "overdue",
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: true, // Mostrar valor para períodos anteriores
			});
		}

		// Período atual: incluir atrasados e os que vencem em breve (sem valor)
		else if (isCurrentPeriod && (boletoIsOverdue || boletoIsDueSoon)) {
			const status: NotificationType = boletoIsOverdue ? "overdue" : "due_soon";
			const amount =
				typeof boleto.amount === "number"
					? boleto.amount
					: Number(boleto.amount) || 0;

			notifications.push({
				id: `boleto-${boleto.id}`,
				type: "boleto",
				name: boleto.name,
				dueDate,
				status,
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

	return {
		notifications,
		totalCount: notifications.length,
	};
}
