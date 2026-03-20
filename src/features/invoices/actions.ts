"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { cards, categories, invoices, transactions } from "@/db/schema";
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
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import {
	getBusinessTodayDate,
	parseLocalDateString,
} from "@/shared/utils/date";

const isValidPaymentDate = (value: string) =>
	!Number.isNaN(parseLocalDateString(value).getTime());

const updateInvoicePaymentStatusSchema = z.object({
	cardId: z.string({ message: "Cartão inválido." }).uuid("Cartão inválido."),
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
		const adminPayerId = await getAdminPayerId(user.id);

		await db.transaction(async (tx: typeof db) => {
			const card = await tx.query.cards.findFirst({
				columns: { id: true, accountId: true, name: true },
				where: and(eq(cards.id, data.cardId), eq(cards.userId, user.id)),
			});

			if (!card) {
				throw new Error("Cartão não encontrado.");
			}

			await tx
				.insert(invoices)
				.values({
					cardId: data.cardId,
					period: data.period,
					paymentStatus: data.status,
					userId: user.id,
				})
				.onConflictDoUpdate({
					target: [invoices.userId, invoices.cardId, invoices.period],
					set: {
						paymentStatus: data.status,
					},
				});

			const shouldMarkAsPaid = data.status === INVOICE_PAYMENT_STATUS.PAID;

			await tx
				.update(transactions)
				.set({ isSettled: shouldMarkAsPaid })
				.where(
					and(
						eq(transactions.userId, user.id),
						eq(transactions.cardId, card.id),
						eq(transactions.period, data.period),
					),
				);

			const invoiceNote = buildInvoicePaymentNote(card.id, data.period);

			if (shouldMarkAsPaid) {
				const [adminShareRow] = adminPayerId
					? await tx
							.select({
								total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
							})
							.from(transactions)
							.where(
								and(
									eq(transactions.userId, user.id),
									eq(transactions.cardId, card.id),
									eq(transactions.period, data.period),
									eq(transactions.payerId, adminPayerId),
								),
							)
					: [{ total: 0 }];

				const adminShare = Number(adminShareRow?.total ?? 0);
				const adminPayableAmount = Math.abs(Math.min(adminShare, 0));

				if (card.accountId && adminPayerId) {
					const paymentCategory = await tx.query.categories.findFirst({
						columns: { id: true },
						where: and(
							eq(categories.userId, user.id),
							eq(categories.name, "Pagamentos"),
						),
					});

					// Usar a data customizada ou a data atual como data de pagamento
					const invoiceDate = data.paymentDate
						? parseLocalDateString(data.paymentDate)
						: getBusinessTodayDate();

					const amount = `-${formatDecimal(adminPayableAmount)}`;
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
						accountId: card.accountId,
						categoryId: paymentCategory?.id ?? null,
						payerId: adminPayerId,
					};

					const existingPayment = await tx.query.transactions.findFirst({
						columns: { id: true },
						where: and(
							eq(transactions.userId, user.id),
							eq(transactions.note, invoiceNote),
						),
					});

					if (existingPayment) {
						await tx
							.update(transactions)
							.set(payload)
							.where(eq(transactions.id, existingPayment.id));
					} else {
						await tx.insert(transactions).values(payload);
					}
				}
			} else {
				await tx
					.delete(transactions)
					.where(
						and(
							eq(transactions.userId, user.id),
							eq(transactions.note, invoiceNote),
						),
					);
			}
		});

		revalidateForEntity("cards", user.id);

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
	cardId: z.string({ message: "Cartão inválido." }).uuid("Cartão inválido."),
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
			const card = await tx.query.cards.findFirst({
				columns: { id: true },
				where: and(eq(cards.id, data.cardId), eq(cards.userId, user.id)),
			});

			if (!card) {
				throw new Error("Cartão não encontrado.");
			}

			const invoiceNote = buildInvoicePaymentNote(card.id, data.period);

			const existingPayment = await tx.query.transactions.findFirst({
				columns: { id: true },
				where: and(
					eq(transactions.userId, user.id),
					eq(transactions.note, invoiceNote),
				),
			});

			if (!existingPayment) {
				throw new Error("Pagamento não encontrado.");
			}

			await tx
				.update(transactions)
				.set({
					purchaseDate: parseLocalDateString(data.paymentDate),
				})
				.where(eq(transactions.id, existingPayment.id));
		});

		revalidateForEntity("cards", user.id);

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
