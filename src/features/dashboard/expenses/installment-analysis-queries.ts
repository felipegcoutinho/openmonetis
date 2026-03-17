import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { cards, transactions } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import {
	buildDateOnlyStringFromPeriodDay,
	parseLocalDateString,
} from "@/shared/utils/date";
import { safeToNumber as toNumber } from "@/shared/utils/number";

// Calcula a data de vencimento baseada no período e dia de vencimento do cartão
function calculateDueDate(period: string, dueDay: string | null): Date | null {
	if (!dueDay) return null;

	try {
		const dueDateString = buildDateOnlyStringFromPeriodDay(period, dueDay);
		if (!dueDateString) return null;

		const dueDate = parseLocalDateString(dueDateString);
		if (Number.isNaN(dueDate.getTime())) return null;

		// Meio-dia evita drift visual em serialização/locales diferentes.
		dueDate.setHours(12, 0, 0, 0);
		return dueDate;
	} catch {
		return null;
	}
}

export type InstallmentDetail = {
	id: string;
	currentInstallment: number;
	amount: number;
	dueDate: Date | null;
	period: string;
	isAnticipated: boolean;
	purchaseDate: Date;
	isSettled: boolean;
};

export type InstallmentGroup = {
	seriesId: string;
	name: string;
	paymentMethod: string;
	cardId: string | null;
	cartaoName: string | null;
	cartaoDueDay: string | null;
	cartaoLogo: string | null;
	totalInstallments: number;
	paidInstallments: number;
	pendingInstallments: InstallmentDetail[];
	totalPendingAmount: number;
	firstPurchaseDate: Date;
};

export type InstallmentAnalysisData = {
	installmentGroups: InstallmentGroup[];
	totalPendingInstallments: number;
};

export async function fetchInstallmentAnalysis(
	userId: string,
): Promise<InstallmentAnalysisData> {
	const adminPayerId = await getAdminPayerId(userId);

	if (!adminPayerId) {
		return { installmentGroups: [], totalPendingInstallments: 0 };
	}

	// 1. Buscar todos os lançamentos parcelados não antecipados do pagador admin
	const installmentRows = await db
		.select({
			id: transactions.id,
			seriesId: transactions.seriesId,
			name: transactions.name,
			amount: transactions.amount,
			paymentMethod: transactions.paymentMethod,
			currentInstallment: transactions.currentInstallment,
			installmentCount: transactions.installmentCount,
			dueDate: transactions.dueDate,
			period: transactions.period,
			isAnticipated: transactions.isAnticipated,
			isSettled: transactions.isSettled,
			purchaseDate: transactions.purchaseDate,
			cardId: transactions.cardId,
			cartaoName: cards.name,
			cartaoDueDay: cards.dueDay,
			cartaoLogo: cards.logo,
		})
		.from(transactions)
		.leftJoin(cards, eq(transactions.cardId, cards.id))
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.payerId, adminPayerId),
				eq(transactions.transactionType, "Despesa"),
				eq(transactions.condition, "Parcelado"),
				eq(transactions.isAnticipated, false),
				isNotNull(transactions.seriesId),
				or(
					isNull(transactions.note),
					and(
						sql`${transactions.note} != ${INITIAL_BALANCE_NOTE}`,
						sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			),
		)
		.orderBy(transactions.purchaseDate, transactions.currentInstallment);

	// Agrupar por seriesId
	const seriesMap = new Map<string, InstallmentGroup>();

	for (const row of installmentRows) {
		if (!row.seriesId) continue;

		const amount = Math.abs(toNumber(row.amount));

		// Calcular vencimento correto baseado no período e dia de vencimento do cartão
		const calculatedDueDate = row.cartaoDueDay
			? calculateDueDate(row.period, row.cartaoDueDay)
			: row.dueDate;

		const installmentDetail: InstallmentDetail = {
			id: row.id,
			currentInstallment: row.currentInstallment ?? 1,
			amount,
			dueDate: calculatedDueDate,
			period: row.period,
			isAnticipated: row.isAnticipated ?? false,
			purchaseDate: row.purchaseDate,
			isSettled: row.isSettled ?? false,
		};

		if (seriesMap.has(row.seriesId)) {
			const group = seriesMap.get(row.seriesId);
			group?.pendingInstallments.push(installmentDetail);
			if (group) group.totalPendingAmount += amount;
		} else {
			seriesMap.set(row.seriesId, {
				seriesId: row.seriesId,
				name: row.name,
				paymentMethod: row.paymentMethod,
				cardId: row.cardId,
				cartaoName: row.cartaoName,
				cartaoDueDay: row.cartaoDueDay,
				cartaoLogo: row.cartaoLogo,
				totalInstallments: row.installmentCount ?? 0,
				paidInstallments: 0,
				pendingInstallments: [installmentDetail],
				totalPendingAmount: amount,
				firstPurchaseDate: row.purchaseDate,
			});
		}
	}

	// Calcular quantas parcelas já foram pagas para cada grupo
	const installmentGroups = Array.from(seriesMap.values())
		.map((group) => {
			// Contar quantas parcelas estão marcadas como pagas (settled)
			const paidCount = group.pendingInstallments.filter(
				(i) => i.isSettled,
			).length;
			group.paidInstallments = paidCount;
			return group;
		})
		// Filtrar apenas séries que têm pelo menos uma parcela em aberto (não paga)
		.filter((group) => {
			const hasUnpaidInstallments = group.pendingInstallments.some(
				(i) => !i.isSettled,
			);
			return hasUnpaidInstallments;
		});

	// Calcular totais
	const totalPendingInstallments = installmentGroups.reduce(
		(sum, group) => sum + group.totalPendingAmount,
		0,
	);

	return { installmentGroups, totalPendingInstallments };
}
