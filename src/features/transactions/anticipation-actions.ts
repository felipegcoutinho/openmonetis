"use server";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import {
	categories,
	installmentAnticipations,
	payers,
	transactions,
} from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	generateAnticipationDescription,
	generateAnticipationNote,
} from "@/shared/lib/installments/anticipation-helpers";
import type {
	CancelAnticipationInput,
	CreateAnticipationInput,
	EligibleInstallment,
	InstallmentAnticipationWithRelations,
} from "@/shared/lib/installments/anticipation-types";
import { uuidSchema } from "@/shared/lib/schemas/common";
import type { ActionResult } from "@/shared/lib/types/actions";
import { formatDecimalForDbRequired } from "@/shared/utils/currency";

/**
 * Schema de validação para criar antecipação
 */
const createAnticipationSchema = z.object({
	seriesId: uuidSchema("Série"),
	installmentIds: z
		.array(uuidSchema("Parcela"))
		.min(1, "Selecione pelo menos uma parcela para antecipar."),
	anticipationPeriod: z
		.string()
		.trim()
		.regex(/^(\d{4})-(\d{2})$/, {
			message: "Selecione um período válido.",
		}),
	discount: z.coerce
		.number()
		.min(0, "Informe um desconto maior ou igual a zero.")
		.optional()
		.default(0),
	payerId: uuidSchema("Payer").optional(),
	categoryId: uuidSchema("Category").optional(),
	note: z.string().trim().optional(),
});

/**
 * Schema de validação para cancelar antecipação
 */
const cancelAnticipationSchema = z.object({
	anticipationId: uuidSchema("Antecipação"),
});

/**
 * Busca parcelas elegíveis para antecipação de uma série
 */
export async function getEligibleInstallmentsAction(
	seriesId: string,
): Promise<ActionResult<EligibleInstallment[]>> {
	try {
		const user = await getUser();

		// Validar seriesId
		const validatedSeriesId = uuidSchema("Série").parse(seriesId);

		// Buscar todas as parcelas da série que estão elegíveis
		const rows = await db.query.transactions.findMany({
			where: and(
				eq(transactions.seriesId, validatedSeriesId),
				eq(transactions.userId, user.id),
				eq(transactions.condition, "Parcelado"),
				// Apenas parcelas não pagas e não antecipadas
				or(eq(transactions.isSettled, false), isNull(transactions.isSettled)),
				eq(transactions.isAnticipated, false),
			),
			orderBy: [asc(transactions.currentInstallment)],
			columns: {
				id: true,
				name: true,
				amount: true,
				period: true,
				purchaseDate: true,
				dueDate: true,
				currentInstallment: true,
				installmentCount: true,
				paymentMethod: true,
				categoryId: true,
				payerId: true,
			},
		});

		const eligibleInstallments: EligibleInstallment[] = rows.map((row) => ({
			id: row.id,
			name: row.name,
			amount: row.amount,
			period: row.period,
			purchaseDate: row.purchaseDate,
			dueDate: row.dueDate,
			currentInstallment: row.currentInstallment,
			installmentCount: row.installmentCount,
			paymentMethod: row.paymentMethod,
			categoryId: row.categoryId,
			payerId: row.payerId,
		}));

		return {
			success: true,
			message: "Parcelas elegíveis carregadas.",
			data: eligibleInstallments,
		};
	} catch (error) {
		return handleActionError(error) as ActionResult<EligibleInstallment[]>;
	}
}

/**
 * Cria uma antecipação de parcelas
 */
export async function createInstallmentAnticipationAction(
	input: CreateAnticipationInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createAnticipationSchema.parse(input);

		// 1. Validar parcelas selecionadas
		const installments = await db.query.transactions.findMany({
			where: and(
				inArray(transactions.id, data.installmentIds),
				eq(transactions.userId, user.id),
				eq(transactions.seriesId, data.seriesId),
				or(eq(transactions.isSettled, false), isNull(transactions.isSettled)),
				eq(transactions.isAnticipated, false),
			),
		});

		if (installments.length !== data.installmentIds.length) {
			return {
				success: false,
				error: "Algumas parcelas não estão elegíveis para antecipação.",
			};
		}

		if (installments.length === 0) {
			return {
				success: false,
				error: "Nenhuma parcela selecionada para antecipação.",
			};
		}

		// 2. Calcular valor total
		const totalAmountCents = installments.reduce(
			(sum, inst) => sum + Number(inst.amount) * 100,
			0,
		);
		const totalAmount = totalAmountCents / 100;
		const totalAmountAbs = Math.abs(totalAmount);

		// 2.1. Aplicar desconto
		const discount = data.discount || 0;

		// 2.2. Validar que o desconto não é maior que o valor absoluto total
		if (discount > totalAmountAbs) {
			return {
				success: false,
				error: "O desconto não pode ser maior que o valor total das parcelas.",
			};
		}

		// 2.3. Calcular valor final (se negativo, soma o desconto para reduzir a despesa)
		const finalAmount =
			totalAmount < 0
				? totalAmount + discount // Despesa: -1000 + 20 = -980
				: totalAmount - discount; // Receita: 1000 - 20 = 980

		// 3. Pegar dados da primeira parcela para referência
		const firstInstallment = installments[0];

		// 4. Criar lançamento e antecipação em transação
		await db.transaction(async (tx: typeof db) => {
			// 4.1. Criar o lançamento de antecipação (com desconto aplicado)
			const [newLancamento] = (await tx
				.insert(transactions)
				.values({
					name: generateAnticipationDescription(
						firstInstallment.name,
						installments.length,
					),
					condition: "À vista",
					transactionType: firstInstallment.transactionType,
					paymentMethod: firstInstallment.paymentMethod,
					amount: formatDecimalForDbRequired(finalAmount),
					purchaseDate: new Date(),
					period: data.anticipationPeriod,
					dueDate: null,
					isSettled: false,
					payerId: data.payerId ?? firstInstallment.payerId,
					categoryId: data.categoryId ?? firstInstallment.categoryId,
					cardId: firstInstallment.cardId,
					accountId: firstInstallment.accountId,
					note:
						data.note ||
						generateAnticipationNote(
							installments.map((inst) => ({
								id: inst.id,
								name: inst.name,
								amount: inst.amount,
								period: inst.period,
								purchaseDate: inst.purchaseDate,
								dueDate: inst.dueDate,
								currentInstallment: inst.currentInstallment,
								installmentCount: inst.installmentCount,
								paymentMethod: inst.paymentMethod,
								categoryId: inst.categoryId,
								payerId: inst.payerId,
							})),
						),
					userId: user.id,
					installmentCount: null,
					currentInstallment: null,
					recurrenceCount: null,
					isAnticipated: false,
					isDivided: false,
					seriesId: null,
					transferId: null,
					anticipationId: null,
					boletoPaymentDate: null,
				})
				.returning()) as Array<typeof transactions.$inferSelect>;

			// 4.2. Criar registro de antecipação
			const [anticipation] = (await tx
				.insert(installmentAnticipations)
				.values({
					seriesId: data.seriesId,
					anticipationPeriod: data.anticipationPeriod,
					anticipationDate: new Date(),
					anticipatedInstallmentIds: data.installmentIds,
					totalAmount: formatDecimalForDbRequired(totalAmount),
					installmentCount: installments.length,
					discount: formatDecimalForDbRequired(discount),
					transactionId: newLancamento.id,
					payerId: data.payerId ?? firstInstallment.payerId,
					categoryId: data.categoryId ?? firstInstallment.categoryId,
					note: data.note || null,
					userId: user.id,
				})
				.returning()) as Array<typeof installmentAnticipations.$inferSelect>;

			// 4.3. Marcar parcelas como antecipadas e zerar seus valores
			await tx
				.update(transactions)
				.set({
					isAnticipated: true,
					anticipationId: anticipation.id,
					amount: "0", // Zera o valor para não contar em dobro
				})
				.where(
					and(
						inArray(transactions.id, data.installmentIds),
						eq(transactions.userId, user.id),
					),
				);
		});

		revalidateForEntity("transactions", user.id);

		return {
			success: true,
			message: `${installments.length} ${
				installments.length === 1
					? "parcela antecipada"
					: "parcelas antecipadas"
			} com sucesso!`,
		};
	} catch (error) {
		return handleActionError(error);
	}
}

/**
 * Busca histórico de antecipações de uma série
 */
export async function getInstallmentAnticipationsAction(
	seriesId: string,
): Promise<ActionResult<InstallmentAnticipationWithRelations[]>> {
	try {
		const user = await getUser();

		// Validar seriesId
		const validatedSeriesId = uuidSchema("Série").parse(seriesId);

		// Usar query builder ao invés de db.query para evitar problemas de tipagem
		const anticipations = await db
			.select({
				id: installmentAnticipations.id,
				seriesId: installmentAnticipations.seriesId,
				anticipationPeriod: installmentAnticipations.anticipationPeriod,
				anticipationDate: installmentAnticipations.anticipationDate,
				anticipatedInstallmentIds:
					installmentAnticipations.anticipatedInstallmentIds,
				totalAmount: installmentAnticipations.totalAmount,
				installmentCount: installmentAnticipations.installmentCount,
				discount: installmentAnticipations.discount,
				transactionId: installmentAnticipations.transactionId,
				payerId: installmentAnticipations.payerId,
				categoryId: installmentAnticipations.categoryId,
				note: installmentAnticipations.note,
				userId: installmentAnticipations.userId,
				createdAt: installmentAnticipations.createdAt,
				// Joins
				transaction: transactions,
				payer: payers,
				category: categories,
			})
			.from(installmentAnticipations)
			.leftJoin(
				transactions,
				eq(installmentAnticipations.transactionId, transactions.id),
			)
			.leftJoin(payers, eq(installmentAnticipations.payerId, payers.id))
			.leftJoin(
				categories,
				eq(installmentAnticipations.categoryId, categories.id),
			)
			.where(
				and(
					eq(installmentAnticipations.seriesId, validatedSeriesId),
					eq(installmentAnticipations.userId, user.id),
				),
			)
			.orderBy(desc(installmentAnticipations.createdAt));

		return {
			success: true,
			message: "Antecipações carregadas.",
			data: anticipations,
		};
	} catch (error) {
		return handleActionError(error) as ActionResult<
			InstallmentAnticipationWithRelations[]
		>;
	}
}

/**
 * Cancela uma antecipação de parcelas
 * Remove o lançamento de antecipação e restaura as parcelas originais
 */
export async function cancelInstallmentAnticipationAction(
	input: CancelAnticipationInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = cancelAnticipationSchema.parse(input);

		await db.transaction(async (tx: typeof db) => {
			// 1. Buscar antecipação usando query builder
			const anticipationRows = await tx
				.select({
					id: installmentAnticipations.id,
					seriesId: installmentAnticipations.seriesId,
					anticipationPeriod: installmentAnticipations.anticipationPeriod,
					anticipationDate: installmentAnticipations.anticipationDate,
					anticipatedInstallmentIds:
						installmentAnticipations.anticipatedInstallmentIds,
					totalAmount: installmentAnticipations.totalAmount,
					installmentCount: installmentAnticipations.installmentCount,
					discount: installmentAnticipations.discount,
					transactionId: installmentAnticipations.transactionId,
					payerId: installmentAnticipations.payerId,
					categoryId: installmentAnticipations.categoryId,
					note: installmentAnticipations.note,
					userId: installmentAnticipations.userId,
					createdAt: installmentAnticipations.createdAt,
					transaction: transactions,
				})
				.from(installmentAnticipations)
				.leftJoin(
					transactions,
					eq(installmentAnticipations.transactionId, transactions.id),
				)
				.where(
					and(
						eq(installmentAnticipations.id, data.anticipationId),
						eq(installmentAnticipations.userId, user.id),
					),
				)
				.limit(1);

			const anticipation = anticipationRows[0];

			if (!anticipation) {
				throw new Error("Antecipação não encontrada.");
			}

			// 2. Verificar se o lançamento já foi pago
			if (anticipation.transaction?.isSettled === true) {
				throw new Error(
					"Não é possível cancelar uma antecipação já paga. Remova o pagamento primeiro.",
				);
			}

			// 3. Calcular valor original por parcela (totalAmount sem desconto / quantidade)
			const originalTotalAmount = Number(anticipation.totalAmount);
			const originalValuePerInstallment =
				originalTotalAmount / anticipation.installmentCount;

			// 4. Remover flag de antecipação e restaurar valores das parcelas
			await tx
				.update(transactions)
				.set({
					isAnticipated: false,
					anticipationId: null,
					amount: formatDecimalForDbRequired(originalValuePerInstallment),
				})
				.where(
					and(
						inArray(
							transactions.id,
							anticipation.anticipatedInstallmentIds as string[],
						),
						eq(transactions.userId, user.id),
					),
				);

			// 5. Deletar lançamento de antecipação
			await tx
				.delete(transactions)
				.where(
					and(
						eq(transactions.id, anticipation.transactionId),
						eq(transactions.userId, user.id),
					),
				);

			// 6. Deletar registro de antecipação
			await tx
				.delete(installmentAnticipations)
				.where(
					and(
						eq(installmentAnticipations.id, data.anticipationId),
						eq(installmentAnticipations.userId, user.id),
					),
				);
		});

		revalidateForEntity("transactions", user.id);

		return {
			success: true,
			message: "Antecipação cancelada com sucesso!",
		};
	} catch (error) {
		return handleActionError(error);
	}
}

/**
 * Busca detalhes de uma antecipação específica
 */
export async function getAnticipationDetailsAction(
	anticipationId: string,
): Promise<ActionResult<InstallmentAnticipationWithRelations>> {
	try {
		const user = await getUser();

		// Validar anticipationId
		const validatedId = uuidSchema("Antecipação").parse(anticipationId);

		const anticipation = await db.query.installmentAnticipations.findFirst({
			where: and(
				eq(installmentAnticipations.id, validatedId),
				eq(installmentAnticipations.userId, user.id),
			),
			with: {
				transaction: true,
				payer: true,
				category: true,
			},
		});

		if (!anticipation) {
			return {
				success: false,
				error: "Antecipação não encontrada.",
			};
		}

		return {
			success: true,
			message: "Detalhes da antecipação carregados.",
			data: anticipation,
		};
	} catch (error) {
		return handleActionError(
			error,
		) as ActionResult<InstallmentAnticipationWithRelations>;
	}
}
