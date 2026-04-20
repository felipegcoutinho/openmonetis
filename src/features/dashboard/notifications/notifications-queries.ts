import { and, eq, gte, inArray, isNotNull, lt, ne, sql } from "drizzle-orm";
import {
	budgets,
	cards,
	categories,
	dashboardNotificationStates,
	invoices,
	transactions,
} from "@/db/schema";
import { buildInvoiceDetailsHref } from "@/features/dashboard/invoices/invoices-helpers";
import { db } from "@/shared/lib/db";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";
import { isNotificationStatesTableMissing } from "@/shared/lib/notifications/is-table-missing";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import type {
	BudgetNotification,
	DashboardNotification,
	DashboardNotificationsSnapshot,
} from "@/shared/lib/types/notifications";
import {
	buildDateOnlyStringFromPeriodDay,
	getBusinessDateString,
	isDateOnlyPast,
	isDateOnlyWithinDays,
	toDateOnlyString,
} from "@/shared/utils/date";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import {
	addMonthsToPeriod,
	formatPeriodForUrl,
	getNextPeriod,
} from "@/shared/utils/period";

export type {
	BudgetNotification,
	BudgetStatus,
	DashboardNotification,
	DashboardNotificationsSnapshot,
	NotificationType,
} from "@/shared/lib/types/notifications";

const PAYMENT_METHOD_BOLETO = "Boleto";
const BUDGET_CRITICAL_THRESHOLD = 80;

type PersistedNotificationState = {
	notificationKey: string;
	fingerprint: string;
	readAt: Date | null;
	archivedAt: Date | null;
};

const buildInvoiceNotificationKey = (cardId: string, period: string) =>
	`invoice-${cardId}-${period}`;

const buildBoletoNotificationKey = (transactionId: string) =>
	`boleto-${transactionId}`;

const buildBudgetNotificationKey = (
	categoryId: string | null,
	budgetId: string,
	period: string,
) => (categoryId ? `budget-${categoryId}-${period}` : `budget-${budgetId}`);

function mergeNotificationState<
	T extends {
		notificationKey: string;
		fingerprint: string;
		isRead: boolean;
		isArchived: boolean;
		readAt: Date | null;
		archivedAt: Date | null;
	},
>(items: T[], stateByKey: Map<string, PersistedNotificationState>): T[] {
	return items.map((item) => {
		const persisted = stateByKey.get(item.notificationKey);

		if (!persisted || persisted.fingerprint !== item.fingerprint) {
			return item;
		}

		return {
			...item,
			isRead: persisted.readAt !== null,
			isArchived: persisted.archivedAt !== null,
			readAt: persisted.readAt,
			archivedAt: persisted.archivedAt,
		};
	});
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
	const today = getBusinessDateString();
	const DAYS_THRESHOLD = 5;
	const nextPeriod = getNextPeriod(currentPeriod);

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
	boletosConditions.push(isNotNull(transactions.dueDate));
	boletosConditions.push(
		gte(transactions.period, addMonthsToPeriod(currentPeriod, -12)),
	);

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

	// Helper: monta a query de faturas por período (reutilizada para período atual e próximo)
	const buildPeriodInvoicesQuery = (period: string) =>
		db
			.select({
				invoiceId: invoices.id,
				cardId: cards.id,
				cardName: cards.name,
				cardLogo: cards.logo,
				dueDay: cards.dueDay,
				period: sql<string>`COALESCE(${invoices.period}, ${period})`,
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
					eq(invoices.period, period),
				),
			)
			.leftJoin(
				transactions,
				and(
					eq(transactions.cardId, cards.id),
					eq(transactions.userId, userId),
					eq(transactions.period, period),
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
			);

	// --- All 5 queries are independent — run in parallel ---
	const [
		overdueInvoices,
		currentInvoices,
		nextPeriodInvoices,
		boletosRows,
		budgetRows,
	] = await Promise.all([
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
		// Faturas do período atual e próximo
		buildPeriodInvoicesQuery(currentPeriod),
		buildPeriodInvoicesQuery(nextPeriod),
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
				categoryId: budgets.categoryId,
				budgetAmount: budgets.amount,
				period: budgets.period,
				categoriaName: categories.name,
				spentAmount: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
			})
			.from(budgets)
			.innerJoin(categories, eq(budgets.categoryId, categories.id))
			.leftJoin(transactions, and(...budgetJoinConditions))
			.where(and(eq(budgets.userId, userId), eq(budgets.period, currentPeriod)))
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
		const notificationKey = buildInvoiceNotificationKey(
			invoice.cardId,
			invoice.period,
		);

		notifications.push({
			type: "invoice",
			name: invoice.cardName,
			dueDate,
			status: "overdue",
			amount: Math.abs(amount),
			period: invoice.period,
			showAmount: true,
			cardLogo: invoice.cardLogo,
			notificationKey,
			fingerprint: "overdue",
			href: buildInvoiceDetailsHref(invoice.cardId, invoice.period),
			isRead: false,
			isArchived: false,
			readAt: null,
			archivedAt: null,
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

		const notificationStatus = invoiceIsOverdue ? "overdue" : "due_soon";
		const notificationKey = buildInvoiceNotificationKey(
			invoice.cardId,
			invoice.period,
		);

		notifications.push({
			type: "invoice",
			name: invoice.cardName,
			dueDate,
			status: notificationStatus,
			amount: Math.abs(amount),
			period: invoice.period,
			showAmount: invoiceIsOverdue,
			cardLogo: invoice.cardLogo,
			notificationKey,
			fingerprint: notificationStatus,
			href: buildInvoiceDetailsHref(invoice.cardId, invoice.period),
			isRead: false,
			isArchived: false,
			readAt: null,
			archivedAt: null,
		});
	}

	// Faturas do próximo período com vencimento próximo
	const addedNotificationKeys = new Set(
		notifications.map((n) => n.notificationKey),
	);
	for (const invoice of nextPeriodInvoices) {
		if (!invoice.dueDay) continue;
		const dueDate = buildDateOnlyStringFromPeriodDay(
			nextPeriod,
			invoice.dueDay,
		);
		if (!dueDate) continue;
		if (invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID) continue;

		const invoiceIsDueSoon = isDateOnlyWithinDays(
			dueDate,
			DAYS_THRESHOLD,
			today,
		);
		if (!invoiceIsDueSoon) continue;

		const notificationKey = buildInvoiceNotificationKey(
			invoice.cardId,
			nextPeriod,
		);
		// Evitar duplicata se já foi adicionado via currentInvoices
		if (addedNotificationKeys.has(notificationKey)) continue;

		const amount = toNumber(invoice.totalAmount);
		notifications.push({
			type: "invoice",
			name: invoice.cardName,
			dueDate,
			status: "due_soon",
			amount: Math.abs(amount),
			period: nextPeriod,
			showAmount: false,
			cardLogo: invoice.cardLogo,
			notificationKey,
			fingerprint: "due_soon",
			href: buildInvoiceDetailsHref(invoice.cardId, nextPeriod),
			isRead: false,
			isArchived: false,
			readAt: null,
			archivedAt: null,
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
		const isNextPeriod = boleto.period === nextPeriod;
		const amount = toNumber(boleto.amount);
		const href = `/transactions?periodo=${formatPeriodForUrl(boleto.period)}`;
		const notificationKey = buildBoletoNotificationKey(boleto.id);

		if (isOldPeriod) {
			notifications.push({
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: "overdue",
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: true,
				notificationKey,
				fingerprint: "overdue",
				href,
				isRead: false,
				isArchived: false,
				readAt: null,
				archivedAt: null,
			});
		} else if (isCurrentPeriod && (boletoIsOverdue || boletoIsDueSoon)) {
			const notificationStatus = boletoIsOverdue ? "overdue" : "due_soon";

			notifications.push({
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: notificationStatus,
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: boletoIsOverdue,
				notificationKey,
				fingerprint: notificationStatus,
				href,
				isRead: false,
				isArchived: false,
				readAt: null,
				archivedAt: null,
			});
		} else if (isNextPeriod && boletoIsDueSoon) {
			notifications.push({
				type: "boleto",
				name: boleto.name,
				dueDate,
				status: "due_soon",
				amount: Math.abs(amount),
				period: boleto.period,
				showAmount: false,
				notificationKey,
				fingerprint: "due_soon",
				href,
				isRead: false,
				isArchived: false,
				readAt: null,
				archivedAt: null,
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
		const notificationStatus = usedPercentage >= 100 ? "exceeded" : "critical";
		const notificationKey = buildBudgetNotificationKey(
			row.categoryId,
			row.orcamentoId,
			row.period,
		);

		budgetNotifications.push({
			categoryName: row.categoriaName,
			budgetAmount,
			spentAmount,
			usedPercentage,
			status: notificationStatus,
			notificationKey,
			fingerprint: notificationStatus,
			href: `/budgets?periodo=${formatPeriodForUrl(row.period)}`,
			isRead: false,
			isArchived: false,
			readAt: null,
			archivedAt: null,
		});
	}

	// Excedidos primeiro, depois por percentual decrescente
	budgetNotifications.sort((a, b) => {
		if (a.status === "exceeded" && b.status !== "exceeded") return -1;
		if (a.status !== "exceeded" && b.status === "exceeded") return 1;
		return b.usedPercentage - a.usedPercentage;
	});

	const notificationKeys = [
		...notifications.map((notification) => notification.notificationKey),
		...budgetNotifications.map((notification) => notification.notificationKey),
	];

	let persistedStates: PersistedNotificationState[] = [];

	if (notificationKeys.length > 0) {
		try {
			persistedStates = await db
				.select({
					notificationKey: dashboardNotificationStates.notificationKey,
					fingerprint: dashboardNotificationStates.fingerprint,
					readAt: dashboardNotificationStates.readAt,
					archivedAt: dashboardNotificationStates.archivedAt,
				})
				.from(dashboardNotificationStates)
				.where(
					and(
						eq(dashboardNotificationStates.userId, userId),
						inArray(
							dashboardNotificationStates.notificationKey,
							notificationKeys,
						),
					),
				);
		} catch (error) {
			if (isNotificationStatesTableMissing(error)) {
				console.warn(
					"[DashboardNotifications] Tabela dashboard_notification_states ainda não existe. Voltando ao modo sem persistência.",
				);
			} else {
				throw error;
			}
		}
	}

	const stateByKey = new Map(
		persistedStates.map((state) => [state.notificationKey, state]),
	);

	const mergedNotifications = mergeNotificationState(notifications, stateByKey);
	const mergedBudgetNotifications = mergeNotificationState(
		budgetNotifications,
		stateByKey,
	);
	const visibleNotifications = mergedNotifications.filter(
		(notification) => !notification.isArchived,
	);
	const visibleBudgetNotifications = mergedBudgetNotifications.filter(
		(notification) => !notification.isArchived,
	);
	const unreadCount = [
		...visibleNotifications,
		...visibleBudgetNotifications,
	].filter((notification) => !notification.isRead).length;

	return {
		notifications: mergedNotifications,
		budgetNotifications: mergedBudgetNotifications,
		unreadCount,
		visibleCount:
			visibleNotifications.length + visibleBudgetNotifications.length,
	};
}
