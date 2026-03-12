"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	cartoes,
	categorias,
	faturas,
	lancamentos,
	pagadores,
} from "@/db/schema";
import { buildInvoicePaymentNote } from "@/shared/lib/accounts/constants";
import { revalidateForEntity } from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	INVOICE_PAYMENT_STATUS,
	INVOICE_STATUS_VALUES,
	type InvoicePaymentStatus,
	PERIOD_FORMAT_REGEX,
} from "@/shared/lib/invoices";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import {
	getBusinessTodayDate,
	parseLocalDateString,
} from "@/shared/utils/date";

const isValidPaymentDate = (value: string) =>
	!Number.isNaN(parseLocalDateString(value).getTime());

const updateInvoicePaymentStatusSchema = z.object({
	cartaoId: z.string({ message: "Cartão inválido." }).uuid("Cartão inválido."),
	period: z
		.string({ message: "Período inválido." })
		.regex(PERIOD_FORMAT_REGEX, "Período inválido."),
	status: z.enum(
		INVOICE_STATUS_VALUES as [InvoicePaymentStatus, ...InvoicePaymentStatus[]],
	),
	paymentDate: z
		.string()
		.optional()
		.refine((value) => !value || isValidPaymentDate(value), {
			message: "Data de pagamento inválida.",
		}),
});

type UpdateInvoicePaymentStatusInput = z.infer<
	typeof updateInvoicePaymentStatusSchema
>;

type ActionResult =
	| { success: true; message: string }
	| { success: false; error: string };

const successMessageByStatus: Record<InvoicePaymentStatus, string> = {
	[INVOICE_PAYMENT_STATUS.PAID]: "Fatura marcada como paga.",
	[INVOICE_PAYMENT_STATUS.PENDING]: "Pagamento da fatura foi revertido.",
};

const formatDecimal = (value: number) =>
	(Math.round(value * 100) / 100).toFixed(2);

export async function updateInvoicePaymentStatusAction(
	input: UpdateInvoicePaymentStatusInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateInvoicePaymentStatusSchema.parse(input);

		await db.transaction(async (tx: typeof db) => {
			const card = await tx.query.cartoes.findFirst({
				columns: { id: true, contaId: true, name: true },
				where: and(eq(cartoes.id, data.cartaoId), eq(cartoes.userId, user.id)),
			});

			if (!card) {
				throw new Error("Cartão não encontrado.");
			}

			const existingInvoice = await tx.query.faturas.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(faturas.cartaoId, data.cartaoId),
					eq(faturas.userId, user.id),
					eq(faturas.period, data.period),
				),
			});

			if (existingInvoice) {
				await tx
					.update(faturas)
					.set({
						paymentStatus: data.status,
					})
					.where(eq(faturas.id, existingInvoice.id));
			} else {
				await tx.insert(faturas).values({
					cartaoId: data.cartaoId,
					period: data.period,
					paymentStatus: data.status,
					userId: user.id,
				});
			}

			const shouldMarkAsPaid = data.status === INVOICE_PAYMENT_STATUS.PAID;

			await tx
				.update(lancamentos)
				.set({ isSettled: shouldMarkAsPaid })
				.where(
					and(
						eq(lancamentos.userId, user.id),
						eq(lancamentos.cartaoId, card.id),
						eq(lancamentos.period, data.period),
					),
				);

			const invoiceNote = buildInvoicePaymentNote(card.id, data.period);

			if (shouldMarkAsPaid) {
				const [adminShareRow] = await tx
					.select({
						total: sql<number>`
              coalesce(
                sum(
                  case
                    when ${lancamentos.transactionType} = 'Despesa' then ${lancamentos.amount}
                    else 0
                  end
                ),
                0
              )
            `,
					})
					.from(lancamentos)
					.leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
					.where(
						and(
							eq(lancamentos.userId, user.id),
							eq(lancamentos.cartaoId, card.id),
							eq(lancamentos.period, data.period),
							eq(pagadores.role, PAGADOR_ROLE_ADMIN),
						),
					);

				const adminShare = Math.abs(Number(adminShareRow?.total ?? 0));

				if (adminShare > 0 && card.contaId) {
					const adminPagador = await tx.query.pagadores.findFirst({
						columns: { id: true },
						where: and(
							eq(pagadores.userId, user.id),
							eq(pagadores.role, PAGADOR_ROLE_ADMIN),
						),
					});

					const paymentCategory = await tx.query.categorias.findFirst({
						columns: { id: true },
						where: and(
							eq(categorias.userId, user.id),
							eq(categorias.name, "Pagamentos"),
						),
					});

					if (adminPagador) {
						// Usar a data customizada ou a data atual como data de pagamento
						const invoiceDate = data.paymentDate
							? parseLocalDateString(data.paymentDate)
							: getBusinessTodayDate();

						const amount = `-${formatDecimal(adminShare)}`;
						const payload = {
							condition: "À vista",
							name: `Pagamento fatura - ${card.name}`,
							paymentMethod: "Pix",
							note: invoiceNote,
							amount,
							purchaseDate: invoiceDate,
							transactionType: "Despesa" as const,
							period: data.period,
							isSettled: true,
							userId: user.id,
							contaId: card.contaId,
							categoriaId: paymentCategory?.id ?? null,
							pagadorId: adminPagador.id,
						};

						const existingPayment = await tx.query.lancamentos.findFirst({
							columns: { id: true },
							where: and(
								eq(lancamentos.userId, user.id),
								eq(lancamentos.note, invoiceNote),
							),
						});

						if (existingPayment) {
							await tx
								.update(lancamentos)
								.set(payload)
								.where(eq(lancamentos.id, existingPayment.id));
						} else {
							await tx.insert(lancamentos).values(payload);
						}
					}
				}
			} else {
				await tx
					.delete(lancamentos)
					.where(
						and(
							eq(lancamentos.userId, user.id),
							eq(lancamentos.note, invoiceNote),
						),
					);
			}
		});

		revalidateForEntity("cartoes");

		return { success: true, message: successMessageByStatus[data.status] };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Dados inválidos.",
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "Erro inesperado.",
		};
	}
}

const updatePaymentDateSchema = z.object({
	cartaoId: z.string({ message: "Cartão inválido." }).uuid("Cartão inválido."),
	period: z
		.string({ message: "Período inválido." })
		.regex(PERIOD_FORMAT_REGEX, "Período inválido."),
	paymentDate: z
		.string({ message: "Data de pagamento inválida." })
		.refine((value) => isValidPaymentDate(value), {
			message: "Data de pagamento inválida.",
		}),
});

type UpdatePaymentDateInput = z.infer<typeof updatePaymentDateSchema>;

export async function updatePaymentDateAction(
	input: UpdatePaymentDateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updatePaymentDateSchema.parse(input);

		await db.transaction(async (tx: typeof db) => {
			const card = await tx.query.cartoes.findFirst({
				columns: { id: true },
				where: and(eq(cartoes.id, data.cartaoId), eq(cartoes.userId, user.id)),
			});

			if (!card) {
				throw new Error("Cartão não encontrado.");
			}

			const invoiceNote = buildInvoicePaymentNote(card.id, data.period);

			const existingPayment = await tx.query.lancamentos.findFirst({
				columns: { id: true },
				where: and(
					eq(lancamentos.userId, user.id),
					eq(lancamentos.note, invoiceNote),
				),
			});

			if (!existingPayment) {
				throw new Error("Pagamento não encontrado.");
			}

			await tx
				.update(lancamentos)
				.set({
					purchaseDate: parseLocalDateString(data.paymentDate),
				})
				.where(eq(lancamentos.id, existingPayment.id));
		});

		revalidateForEntity("cartoes");

		return { success: true, message: "Data de pagamento atualizada." };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Dados inválidos.",
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "Erro inesperado.",
		};
	}
}
