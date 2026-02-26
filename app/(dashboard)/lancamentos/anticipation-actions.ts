"use server";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import {
	antecipacoesParcelas,
	categorias,
	lancamentos,
	pagadores,
} from "@/db/schema";
import { handleActionError, revalidateForEntity } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	generateAnticipationDescription,
	generateAnticipationNote,
} from "@/lib/installments/anticipation-helpers";
import type {
	CancelAnticipationInput,
	CreateAnticipationInput,
	EligibleInstallment,
	InstallmentAnticipationWithRelations,
} from "@/lib/installments/anticipation-types";
import { uuidSchema } from "@/lib/schemas/common";
import { formatDecimalForDbRequired } from "@/lib/utils/currency";

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
	pagadorId: uuidSchema("Pagador").optional(),
	categoriaId: uuidSchema("Categoria").optional(),
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
		const rows = await db.query.lancamentos.findMany({
			where: and(
				eq(lancamentos.seriesId, validatedSeriesId),
				eq(lancamentos.userId, user.id),
				eq(lancamentos.condition, "Parcelado"),
				// Apenas parcelas não pagas e não antecipadas
				or(eq(lancamentos.isSettled, false), isNull(lancamentos.isSettled)),
				eq(lancamentos.isAnticipated, false),
			),
			orderBy: [asc(lancamentos.currentInstallment)],
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
				categoriaId: true,
				pagadorId: true,
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
			categoriaId: row.categoriaId,
			pagadorId: row.pagadorId,
		}));

		return {
			success: true,
			data: eligibleInstallments,
		};
	} catch (error) {
		return handleActionError(error);
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
		const installments = await db.query.lancamentos.findMany({
			where: and(
				inArray(lancamentos.id, data.installmentIds),
				eq(lancamentos.userId, user.id),
				eq(lancamentos.seriesId, data.seriesId),
				or(eq(lancamentos.isSettled, false), isNull(lancamentos.isSettled)),
				eq(lancamentos.isAnticipated, false),
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
		await db.transaction(async (tx) => {
			// 4.1. Criar o lançamento de antecipação (com desconto aplicado)
			const [newLancamento] = await tx
				.insert(lancamentos)
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
					pagadorId: data.pagadorId ?? firstInstallment.pagadorId,
					categoriaId: data.categoriaId ?? firstInstallment.categoriaId,
					cartaoId: firstInstallment.cartaoId,
					contaId: firstInstallment.contaId,
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
								categoriaId: inst.categoriaId,
								pagadorId: inst.pagadorId,
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
				.returning();

			// 4.2. Criar registro de antecipação
			const [anticipation] = await tx
				.insert(antecipacoesParcelas)
				.values({
					seriesId: data.seriesId,
					anticipationPeriod: data.anticipationPeriod,
					anticipationDate: new Date(),
					anticipatedInstallmentIds: data.installmentIds,
					totalAmount: formatDecimalForDbRequired(totalAmount),
					installmentCount: installments.length,
					discount: formatDecimalForDbRequired(discount),
					lancamentoId: newLancamento.id,
					pagadorId: data.pagadorId ?? firstInstallment.pagadorId,
					categoriaId: data.categoriaId ?? firstInstallment.categoriaId,
					note: data.note || null,
					userId: user.id,
				})
				.returning();

			// 4.3. Marcar parcelas como antecipadas e zerar seus valores
			await tx
				.update(lancamentos)
				.set({
					isAnticipated: true,
					anticipationId: anticipation.id,
					amount: "0", // Zera o valor para não contar em dobro
				})
				.where(inArray(lancamentos.id, data.installmentIds));
		});

		revalidateForEntity("lancamentos");

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
				id: antecipacoesParcelas.id,
				seriesId: antecipacoesParcelas.seriesId,
				anticipationPeriod: antecipacoesParcelas.anticipationPeriod,
				anticipationDate: antecipacoesParcelas.anticipationDate,
				anticipatedInstallmentIds:
					antecipacoesParcelas.anticipatedInstallmentIds,
				totalAmount: antecipacoesParcelas.totalAmount,
				installmentCount: antecipacoesParcelas.installmentCount,
				discount: antecipacoesParcelas.discount,
				lancamentoId: antecipacoesParcelas.lancamentoId,
				pagadorId: antecipacoesParcelas.pagadorId,
				categoriaId: antecipacoesParcelas.categoriaId,
				note: antecipacoesParcelas.note,
				userId: antecipacoesParcelas.userId,
				createdAt: antecipacoesParcelas.createdAt,
				// Joins
				lancamento: lancamentos,
				pagador: pagadores,
				categoria: categorias,
			})
			.from(antecipacoesParcelas)
			.leftJoin(
				lancamentos,
				eq(antecipacoesParcelas.lancamentoId, lancamentos.id),
			)
			.leftJoin(pagadores, eq(antecipacoesParcelas.pagadorId, pagadores.id))
			.leftJoin(categorias, eq(antecipacoesParcelas.categoriaId, categorias.id))
			.where(
				and(
					eq(antecipacoesParcelas.seriesId, validatedSeriesId),
					eq(antecipacoesParcelas.userId, user.id),
				),
			)
			.orderBy(desc(antecipacoesParcelas.createdAt));

		return {
			success: true,
			data: anticipations,
		};
	} catch (error) {
		return handleActionError(error);
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

		await db.transaction(async (tx) => {
			// 1. Buscar antecipação usando query builder
			const anticipationRows = await tx
				.select({
					id: antecipacoesParcelas.id,
					seriesId: antecipacoesParcelas.seriesId,
					anticipationPeriod: antecipacoesParcelas.anticipationPeriod,
					anticipationDate: antecipacoesParcelas.anticipationDate,
					anticipatedInstallmentIds:
						antecipacoesParcelas.anticipatedInstallmentIds,
					totalAmount: antecipacoesParcelas.totalAmount,
					installmentCount: antecipacoesParcelas.installmentCount,
					discount: antecipacoesParcelas.discount,
					lancamentoId: antecipacoesParcelas.lancamentoId,
					pagadorId: antecipacoesParcelas.pagadorId,
					categoriaId: antecipacoesParcelas.categoriaId,
					note: antecipacoesParcelas.note,
					userId: antecipacoesParcelas.userId,
					createdAt: antecipacoesParcelas.createdAt,
					lancamento: lancamentos,
				})
				.from(antecipacoesParcelas)
				.leftJoin(
					lancamentos,
					eq(antecipacoesParcelas.lancamentoId, lancamentos.id),
				)
				.where(
					and(
						eq(antecipacoesParcelas.id, data.anticipationId),
						eq(antecipacoesParcelas.userId, user.id),
					),
				)
				.limit(1);

			const anticipation = anticipationRows[0];

			if (!anticipation) {
				throw new Error("Antecipação não encontrada.");
			}

			// 2. Verificar se o lançamento já foi pago
			if (anticipation.lancamento?.isSettled === true) {
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
				.update(lancamentos)
				.set({
					isAnticipated: false,
					anticipationId: null,
					amount: formatDecimalForDbRequired(originalValuePerInstallment),
				})
				.where(
					inArray(
						lancamentos.id,
						anticipation.anticipatedInstallmentIds as string[],
					),
				);

			// 5. Deletar lançamento de antecipação
			await tx
				.delete(lancamentos)
				.where(eq(lancamentos.id, anticipation.lancamentoId));

			// 6. Deletar registro de antecipação
			await tx
				.delete(antecipacoesParcelas)
				.where(eq(antecipacoesParcelas.id, data.anticipationId));
		});

		revalidateForEntity("lancamentos");

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

		const anticipation = await db.query.antecipacoesParcelas.findFirst({
			where: and(
				eq(antecipacoesParcelas.id, validatedId),
				eq(antecipacoesParcelas.userId, user.id),
			),
			with: {
				lancamento: true,
				pagador: true,
				categoria: true,
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
			data: anticipation,
		};
	} catch (error) {
		return handleActionError(error);
	}
}
