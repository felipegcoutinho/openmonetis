"use server";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import {
	PAYMENT_METHODS,
	TRANSACTION_CONDITIONS,
	TRANSACTION_TYPES,
} from "@/features/transactions/constants";
import { handleActionError } from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	buildEntriesByPayer,
	sendPayerAutoEmails,
} from "@/shared/lib/payers/notifications";
import type { ActionResult } from "@/shared/lib/types/actions";
import { addMonthsToDate, parseLocalDateString } from "@/shared/utils/date";
import {
	centsToDecimalString,
	type DeleteBulkInput,
	type DeleteMultipleInput,
	deleteBulkSchema,
	deleteMultipleSchema,
	fetchOwnedAccountIds,
	fetchOwnedCardIds,
	fetchOwnedCategoryIds,
	fetchOwnedPayerIds,
	type MassAddInput,
	massAddSchema,
	resolvePeriod,
	resolveUserLabel,
	revalidate,
	type TransactionInsert,
	type UpdateBulkInput,
	updateBulkSchema,
	validateAllOwnership,
} from "./core";

export async function deleteTransactionBulkAction(
	input: DeleteBulkInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteBulkSchema.parse(input);

		const existing = await db.query.transactions.findFirst({
			columns: {
				id: true,
				name: true,
				seriesId: true,
				period: true,
				condition: true,
			},
			where: and(
				eq(transactions.id, data.id),
				eq(transactions.userId, user.id),
			),
		});

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		if (!existing.seriesId) {
			return {
				success: false,
				error: "Este lançamento não faz parte de uma série.",
			};
		}

		if (data.scope === "current") {
			await db
				.delete(transactions)
				.where(
					and(eq(transactions.id, data.id), eq(transactions.userId, user.id)),
				);

			revalidate(user.id);
			return { success: true, message: "Lançamento removido com sucesso." };
		}

		if (data.scope === "period") {
			await db
				.delete(transactions)
				.where(
					and(
						eq(transactions.seriesId, existing.seriesId),
						eq(transactions.userId, user.id),
						eq(transactions.period, existing.period ?? ""),
					),
				);

			revalidate(user.id);
			return {
				success: true,
				message: "Todos os lançamentos do período foram removidos.",
			};
		}

		if (data.scope === "future") {
			await db
				.delete(transactions)
				.where(
					and(
						eq(transactions.seriesId, existing.seriesId),
						eq(transactions.userId, user.id),
						sql`${transactions.period} >= ${existing.period}`,
					),
				);

			revalidate(user.id);
			return {
				success: true,
				message: "Lançamentos removidos com sucesso.",
			};
		}

		if (data.scope === "all") {
			await db
				.delete(transactions)
				.where(
					and(
						eq(transactions.seriesId, existing.seriesId),
						eq(transactions.userId, user.id),
					),
				);

			revalidate(user.id);
			return {
				success: true,
				message: "Todos os lançamentos da série foram removidos.",
			};
		}

		return { success: false, error: "Escopo de ação inválido." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateTransactionBulkAction(
	input: UpdateBulkInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateBulkSchema.parse(input);

		const ownershipError = await validateAllOwnership(user.id, {
			payerId: data.payerId,
			categoryId: data.categoryId,
			accountId: data.accountId,
			cardId: data.cardId,
		});
		if (ownershipError) {
			return { success: false, error: ownershipError };
		}

		const existing = await db.query.transactions.findFirst({
			columns: {
				id: true,
				name: true,
				seriesId: true,
				period: true,
				condition: true,
				transactionType: true,
				purchaseDate: true,
				payerId: true,
			},
			where: and(
				eq(transactions.id, data.id),
				eq(transactions.userId, user.id),
			),
		});

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		if (!existing.seriesId) {
			return {
				success: false,
				error: "Este lançamento não faz parte de uma série.",
			};
		}

		const baseUpdatePayload: Record<string, unknown> = {
			name: data.name,
			categoryId: data.categoryId ?? null,
			note: data.note ?? null,
			// "period" atualiza todos os pagadores do mês — preserva o payerId de cada linha
			...(data.scope !== "period" && { payerId: data.payerId ?? null }),
			accountId: data.accountId ?? null,
			cardId: data.cardId ?? null,
			...(data.isSettled !== undefined && { isSettled: data.isSettled }),
		};

		if (data.amount !== undefined) {
			const amountSign: 1 | -1 =
				existing.transactionType === "Despesa" ? -1 : 1;
			const amountCents = Math.round(Math.abs(data.amount) * 100);
			baseUpdatePayload.amount = centsToDecimalString(amountCents * amountSign);
		}

		const hasDueDateUpdate = data.dueDate !== undefined;
		const hasBoletoPaymentDateUpdate = data.boletoPaymentDate !== undefined;

		const baseDueDate =
			hasDueDateUpdate && data.dueDate
				? parseLocalDateString(data.dueDate)
				: hasDueDateUpdate
					? null
					: undefined;

		const baseBoletoPaymentDate =
			hasBoletoPaymentDateUpdate && data.boletoPaymentDate
				? parseLocalDateString(data.boletoPaymentDate)
				: hasBoletoPaymentDateUpdate
					? null
					: undefined;

		const basePurchaseDate = existing.purchaseDate ?? null;

		const buildDueDateForRecord = (recordPurchaseDate: Date | null) => {
			if (!hasDueDateUpdate) {
				return undefined;
			}

			if (!baseDueDate) {
				return null;
			}

			if (!basePurchaseDate || !recordPurchaseDate) {
				return baseDueDate;
			}

			const monthDiff =
				(recordPurchaseDate.getFullYear() - basePurchaseDate.getFullYear()) *
					12 +
				(recordPurchaseDate.getMonth() - basePurchaseDate.getMonth());

			return addMonthsToDate(baseDueDate, monthDiff);
		};

		const serializeDateKey = (value: Date | null | undefined) => {
			if (value === undefined) {
				return "undefined";
			}
			if (value === null) {
				return "null";
			}
			return String(value.getTime());
		};

		const applyUpdates = async (
			records: Array<{ id: string; purchaseDate: Date | null }>,
		) => {
			if (records.length === 0) {
				return;
			}

			const groupedPayloads = new Map<
				string,
				{
					ids: string[];
					payload: Record<string, unknown>;
				}
			>();

			for (const record of records) {
				const dueDateForRecord = buildDueDateForRecord(record.purchaseDate);
				const perRecordPayload: Record<string, unknown> = {
					...baseUpdatePayload,
				};

				if (dueDateForRecord !== undefined) {
					perRecordPayload.dueDate = dueDateForRecord;
				}

				if (hasBoletoPaymentDateUpdate) {
					perRecordPayload.boletoPaymentDate = baseBoletoPaymentDate ?? null;
				}

				const groupKey = [
					serializeDateKey(dueDateForRecord),
					serializeDateKey(
						hasBoletoPaymentDateUpdate
							? (baseBoletoPaymentDate ?? null)
							: undefined,
					),
				].join("|");

				const group = groupedPayloads.get(groupKey);
				if (group) {
					group.ids.push(record.id);
					continue;
				}

				groupedPayloads.set(groupKey, {
					ids: [record.id],
					payload: perRecordPayload,
				});
			}

			await db.transaction(async (tx: typeof db) => {
				for (const group of groupedPayloads.values()) {
					await tx
						.update(transactions)
						.set(group.payload)
						.where(
							and(
								inArray(transactions.id, group.ids),
								eq(transactions.userId, user.id),
							),
						);
				}
			});
		};

		if (data.scope === "current") {
			await applyUpdates([
				{
					id: data.id,
					purchaseDate: existing.purchaseDate ?? null,
				},
			]);

			revalidate(user.id);
			return { success: true, message: "Lançamento atualizado com sucesso." };
		}

		if (data.scope === "period") {
			if (!existing.period) {
				return {
					success: false,
					error: "Período do lançamento não encontrado.",
				};
			}

			const periodLancamentos = await db.query.transactions.findMany({
				columns: { id: true, purchaseDate: true },
				where: and(
					eq(transactions.seriesId, existing.seriesId),
					eq(transactions.userId, user.id),
					eq(transactions.period, existing.period),
				),
				orderBy: asc(transactions.purchaseDate),
			});

			await applyUpdates(
				periodLancamentos.map((item: (typeof periodLancamentos)[number]) => ({
					id: item.id,
					purchaseDate: item.purchaseDate ?? null,
				})),
			);

			revalidate(user.id);
			return {
				success: true,
				message: "Todos os lançamentos do período foram atualizados.",
			};
		}

		const payerIdFilter = existing.payerId
			? eq(transactions.payerId, existing.payerId)
			: isNull(transactions.payerId);

		if (data.scope === "future") {
			const futureLancamentos = await db.query.transactions.findMany({
				columns: {
					id: true,
					purchaseDate: true,
				},
				where: and(
					eq(transactions.seriesId, existing.seriesId),
					eq(transactions.userId, user.id),
					sql`${transactions.period} >= ${existing.period}`,
					payerIdFilter,
				),
				orderBy: asc(transactions.purchaseDate),
			});

			await applyUpdates(
				futureLancamentos.map((item: (typeof futureLancamentos)[number]) => ({
					id: item.id,
					purchaseDate: item.purchaseDate ?? null,
				})),
			);

			revalidate(user.id);
			return {
				success: true,
				message: "Lançamentos atualizados com sucesso.",
			};
		}

		if (data.scope === "all") {
			const allLancamentos = await db.query.transactions.findMany({
				columns: {
					id: true,
					purchaseDate: true,
				},
				where: and(
					eq(transactions.seriesId, existing.seriesId),
					eq(transactions.userId, user.id),
					payerIdFilter,
				),
				orderBy: asc(transactions.purchaseDate),
			});

			await applyUpdates(
				allLancamentos.map((item: (typeof allLancamentos)[number]) => ({
					id: item.id,
					purchaseDate: item.purchaseDate ?? null,
				})),
			);

			revalidate(user.id);
			return {
				success: true,
				message: "Todos os lançamentos da série foram atualizados.",
			};
		}

		return { success: false, error: "Escopo de ação inválido." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function createMassTransactionsAction(
	input: MassAddInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = massAddSchema.parse(input);

		const uniquePayerIds = new Set<string>();
		const uniqueCategoryIds = new Set<string>();
		for (const transaction of data.transactions) {
			if (transaction.payerId) uniquePayerIds.add(transaction.payerId);
			if (transaction.categoryId) uniqueCategoryIds.add(transaction.categoryId);
		}

		const [ownedAccountIds, ownedCardIds, ownedPayerIds, ownedCategoryIds] =
			await Promise.all([
				fetchOwnedAccountIds(user.id, [data.fixedFields.accountId]),
				fetchOwnedCardIds(user.id, [data.fixedFields.cardId]),
				fetchOwnedPayerIds(user.id, [...uniquePayerIds]),
				fetchOwnedCategoryIds(user.id, [...uniqueCategoryIds]),
			]);

		if (
			data.fixedFields.accountId &&
			!ownedAccountIds.has(data.fixedFields.accountId)
		) {
			return { success: false, error: "Conta não encontrada." };
		}
		if (data.fixedFields.cardId && !ownedCardIds.has(data.fixedFields.cardId)) {
			return { success: false, error: "Cartão não encontrado." };
		}

		const invalidPayers = new Set(
			[...uniquePayerIds].filter((id) => !ownedPayerIds.has(id)),
		);
		const invalidCategories = new Set(
			[...uniqueCategoryIds].filter((id) => !ownedCategoryIds.has(id)),
		);

		for (let i = 0; i < data.transactions.length; i++) {
			const transaction = data.transactions[i];
			if (transaction.payerId && invalidPayers.has(transaction.payerId)) {
				return {
					success: false,
					error: `Payer não encontrado na transação ${i + 1}.`,
				};
			}
			if (
				transaction.categoryId &&
				invalidCategories.has(transaction.categoryId)
			) {
				return {
					success: false,
					error: `Category não encontrada na transação ${i + 1}.`,
				};
			}
		}

		const defaultTransactionType = TRANSACTION_TYPES[0];
		const defaultCondition = TRANSACTION_CONDITIONS[0];
		const defaultPaymentMethod = PAYMENT_METHODS[0];

		const allRecords: TransactionInsert[] = [];
		const notificationData: Array<{
			payerId: string | null;
			name: string | null;
			amount: string | null;
			transactionType: string | null;
			paymentMethod: string | null;
			condition: string | null;
			purchaseDate: Date | null;
			period: string | null;
			note: string | null;
		}> = [];

		for (const transaction of data.transactions) {
			const transactionType =
				data.fixedFields.transactionType ?? defaultTransactionType;
			const condition = data.fixedFields.condition ?? defaultCondition;
			const paymentMethod =
				data.fixedFields.paymentMethod ?? defaultPaymentMethod;
			const payerId = transaction.payerId ?? null;
			const accountId =
				paymentMethod === "Cartão de crédito"
					? null
					: (data.fixedFields.accountId ?? null);
			const cardId =
				paymentMethod === "Cartão de crédito"
					? (data.fixedFields.cardId ?? null)
					: null;
			const categoryId = transaction.categoryId ?? null;

			const period =
				data.fixedFields.period ?? resolvePeriod(transaction.purchaseDate);
			const purchaseDate = parseLocalDateString(transaction.purchaseDate);
			const amountSign: 1 | -1 = transactionType === "Despesa" ? -1 : 1;
			const totalCents = Math.round(Math.abs(transaction.amount) * 100);
			const amount = centsToDecimalString(totalCents * amountSign);
			const isSettled = paymentMethod === "Cartão de crédito" ? null : false;

			const record: TransactionInsert = {
				name: transaction.name,
				purchaseDate,
				period,
				transactionType,
				amount,
				condition,
				paymentMethod,
				payerId,
				accountId,
				cardId,
				categoryId,
				note: null,
				installmentCount: null,
				recurrenceCount: null,
				currentInstallment: null,
				isSettled,
				isDivided: false,
				dueDate: null,
				boletoPaymentDate: null,
				userId: user.id,
				seriesId: null,
			};

			allRecords.push(record);

			notificationData.push({
				payerId,
				name: transaction.name,
				amount,
				transactionType,
				paymentMethod,
				condition,
				purchaseDate,
				period,
				note: null,
			});
		}

		if (!allRecords.length) {
			throw new Error("Não foi possível criar os lançamentos solicitados.");
		}

		await db.transaction(async (tx: typeof db) => {
			await tx.insert(transactions).values(allRecords);
		});

		const notificationEntries = buildEntriesByPayer(notificationData);

		if (notificationEntries.size > 0) {
			await sendPayerAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "created",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate(user.id);

		const count = allRecords.length;
		return {
			success: true,
			message: `${count} ${
				count === 1 ? "lançamento criado" : "lançamentos criados"
			} com sucesso.`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteMultipleTransactionsAction(
	input: DeleteMultipleInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteMultipleSchema.parse(input);

		const existing = await db.query.transactions.findMany({
			columns: {
				id: true,
				name: true,
				payerId: true,
				amount: true,
				transactionType: true,
				paymentMethod: true,
				condition: true,
				purchaseDate: true,
				period: true,
				note: true,
			},
			where: and(
				inArray(transactions.id, data.ids),
				eq(transactions.userId, user.id),
			),
		});

		if (existing.length === 0) {
			return { success: false, error: "Nenhum lançamento encontrado." };
		}

		await db
			.delete(transactions)
			.where(
				and(
					inArray(transactions.id, data.ids),
					eq(transactions.userId, user.id),
				),
			);

		const notificationData = existing
			.filter(
				(
					item: (typeof existing)[number],
				): item is typeof item & {
					payerId: NonNullable<typeof item.payerId>;
				} => Boolean(item.payerId),
			)
			.map((item: (typeof existing)[number]) => ({
				payerId: item.payerId,
				name: item.name ?? null,
				amount: item.amount ?? null,
				transactionType: item.transactionType ?? null,
				paymentMethod: item.paymentMethod ?? null,
				condition: item.condition ?? null,
				purchaseDate: item.purchaseDate ?? null,
				period: item.period ?? null,
				note: item.note ?? null,
			}));

		if (notificationData.length > 0) {
			const notificationEntries = buildEntriesByPayer(notificationData);

			await sendPayerAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "deleted",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate(user.id);

		const count = existing.length;
		return {
			success: true,
			message: `${count} ${
				count === 1 ? "lançamento removido" : "lançamentos removidos"
			} com sucesso.`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}
