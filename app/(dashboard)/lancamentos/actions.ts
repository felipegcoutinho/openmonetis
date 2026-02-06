"use server";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
	cartoes,
	categorias,
	contas,
	lancamentos,
	pagadores,
} from "@/db/schema";
import {
	INITIAL_BALANCE_CONDITION,
	INITIAL_BALANCE_NOTE,
	INITIAL_BALANCE_PAYMENT_METHOD,
	INITIAL_BALANCE_TRANSACTION_TYPE,
} from "@/lib/accounts/constants";
import { handleActionError, revalidateForEntity } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	LANCAMENTO_CONDITIONS,
	LANCAMENTO_PAYMENT_METHODS,
	LANCAMENTO_TRANSACTION_TYPES,
} from "@/lib/lancamentos/constants";
import {
	buildEntriesByPagador,
	sendPagadorAutoEmails,
} from "@/lib/pagadores/notifications";
import { noteSchema, uuidSchema } from "@/lib/schemas/common";
import { formatDecimalForDbRequired } from "@/lib/utils/currency";
import { getTodayDate, parseLocalDateString } from "@/lib/utils/date";

// ============================================================================
// Authorization Validation Functions
// ============================================================================

async function validatePagadorOwnership(
	userId: string,
	pagadorId: string | null | undefined,
): Promise<boolean> {
	if (!pagadorId) return true; // Se não tem pagadorId, não precisa validar

	const pagador = await db.query.pagadores.findFirst({
		where: and(eq(pagadores.id, pagadorId), eq(pagadores.userId, userId)),
	});

	return !!pagador;
}

async function validateCategoriaOwnership(
	userId: string,
	categoriaId: string | null | undefined,
): Promise<boolean> {
	if (!categoriaId) return true;

	const categoria = await db.query.categorias.findFirst({
		where: and(eq(categorias.id, categoriaId), eq(categorias.userId, userId)),
	});

	return !!categoria;
}

async function validateContaOwnership(
	userId: string,
	contaId: string | null | undefined,
): Promise<boolean> {
	if (!contaId) return true;

	const conta = await db.query.contas.findFirst({
		where: and(eq(contas.id, contaId), eq(contas.userId, userId)),
	});

	return !!conta;
}

async function validateCartaoOwnership(
	userId: string,
	cartaoId: string | null | undefined,
): Promise<boolean> {
	if (!cartaoId) return true;

	const cartao = await db.query.cartoes.findFirst({
		where: and(eq(cartoes.id, cartaoId), eq(cartoes.userId, userId)),
	});

	return !!cartao;
}

// ============================================================================
// Utility Functions
// ============================================================================

const resolvePeriod = (purchaseDate: string, period?: string | null) => {
	if (period && /^\d{4}-\d{2}$/.test(period)) {
		return period;
	}

	const date = parseLocalDateString(purchaseDate);
	if (Number.isNaN(date.getTime())) {
		throw new Error("Data da transação inválida.");
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
};

const baseFields = z.object({
	purchaseDate: z
		.string({ message: "Informe a data da transação." })
		.trim()
		.refine((value) => !Number.isNaN(new Date(value).getTime()), {
			message: "Data da transação inválida.",
		}),
	period: z
		.string()
		.trim()
		.regex(/^(\d{4})-(\d{2})$/, {
			message: "Selecione um período válido.",
		})
		.optional(),
	name: z
		.string({ message: "Informe o estabelecimento." })
		.trim()
		.min(1, "Informe o estabelecimento."),
	transactionType: z
		.enum(LANCAMENTO_TRANSACTION_TYPES, {
			message: "Selecione um tipo de transação válido.",
		})
		.default(LANCAMENTO_TRANSACTION_TYPES[0]),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero."),
	condition: z.enum(LANCAMENTO_CONDITIONS, {
		message: "Selecione uma condição válida.",
	}),
	paymentMethod: z.enum(LANCAMENTO_PAYMENT_METHODS, {
		message: "Selecione uma forma de pagamento válida.",
	}),
	pagadorId: uuidSchema("Pagador").nullable().optional(),
	secondaryPagadorId: uuidSchema("Pagador secundário").optional(),
	isSplit: z.boolean().optional().default(false),
	primarySplitAmount: z.coerce.number().min(0).optional(),
	secondarySplitAmount: z.coerce.number().min(0).optional(),
	contaId: uuidSchema("Conta").nullable().optional(),
	cartaoId: uuidSchema("Cartão").nullable().optional(),
	categoriaId: uuidSchema("Categoria").nullable().optional(),
	note: noteSchema,
	installmentCount: z.coerce
		.number()
		.int()
		.min(1, "Selecione uma quantidade válida.")
		.max(60, "Selecione uma quantidade válida.")
		.optional(),
	recurrenceCount: z.coerce
		.number()
		.int()
		.min(1, "Selecione uma recorrência válida.")
		.max(60, "Selecione uma recorrência válida.")
		.optional(),
	dueDate: z
		.string()
		.trim()
		.refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
			message: "Informe uma data de vencimento válida.",
		})
		.optional(),
	boletoPaymentDate: z
		.string()
		.trim()
		.refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
			message: "Informe uma data de pagamento válida.",
		})
		.optional(),
	isSettled: z.boolean().nullable().optional(),
});

const refineLancamento = (
	data: z.infer<typeof baseFields> & { id?: string },
	ctx: z.RefinementCtx,
) => {
	if (data.condition === "Parcelado") {
		if (!data.installmentCount) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["installmentCount"],
				message: "Informe a quantidade de parcelas.",
			});
		} else if (data.installmentCount < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["installmentCount"],
				message: "Selecione pelo menos duas parcelas.",
			});
		}
	}

	if (data.condition === "Recorrente") {
		if (!data.recurrenceCount) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["recurrenceCount"],
				message: "Informe por quantos meses a recorrência acontecerá.",
			});
		} else if (data.recurrenceCount < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["recurrenceCount"],
				message: "A recorrência deve ter ao menos dois meses.",
			});
		}
	}

	if (data.isSplit) {
		if (!data.pagadorId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["pagadorId"],
				message: "Selecione o pagador principal para dividir o lançamento.",
			});
		}

		if (!data.secondaryPagadorId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPagadorId"],
				message: "Selecione o pagador secundário para dividir o lançamento.",
			});
		} else if (data.pagadorId && data.secondaryPagadorId === data.pagadorId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPagadorId"],
				message: "Escolha um pagador diferente para dividir o lançamento.",
			});
		}

		// Validate custom split amounts sum to total
		if (
			data.primarySplitAmount !== undefined &&
			data.secondarySplitAmount !== undefined
		) {
			const sum = data.primarySplitAmount + data.secondarySplitAmount;
			const total = Math.abs(data.amount);
			// Allow 1 cent tolerance for rounding differences
			if (Math.abs(sum - total) > 0.01) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["primarySplitAmount"],
					message: "A soma das divisões deve ser igual ao valor total.",
				});
			}
		}
	}
};

const createSchema = baseFields.superRefine(refineLancamento);
const updateSchema = baseFields
	.extend({
		id: uuidSchema("Lançamento"),
	})
	.superRefine(refineLancamento);

const deleteSchema = z.object({
	id: uuidSchema("Lançamento"),
});

const toggleSettlementSchema = z.object({
	id: uuidSchema("Lançamento"),
	value: z.boolean({
		message: "Informe o status de pagamento.",
	}),
});

type BaseInput = z.infer<typeof baseFields>;
type CreateInput = z.infer<typeof createSchema>;
type UpdateInput = z.infer<typeof updateSchema>;
type DeleteInput = z.infer<typeof deleteSchema>;
type ToggleSettlementInput = z.infer<typeof toggleSettlementSchema>;

const revalidate = () => revalidateForEntity("lancamentos");

const resolveUserLabel = (user: {
	name?: string | null;
	email?: string | null;
}) => {
	if (user?.name && user.name.trim().length > 0) {
		return user.name;
	}
	if (user?.email && user.email.trim().length > 0) {
		return user.email;
	}
	return "Opensheets";
};

type InitialCandidate = {
	note: string | null;
	transactionType: string | null;
	condition: string | null;
	paymentMethod: string | null;
};

const isInitialBalanceLancamento = (record?: InitialCandidate | null) =>
	!!record &&
	record.note === INITIAL_BALANCE_NOTE &&
	record.transactionType === INITIAL_BALANCE_TRANSACTION_TYPE &&
	record.condition === INITIAL_BALANCE_CONDITION &&
	record.paymentMethod === INITIAL_BALANCE_PAYMENT_METHOD;

const centsToDecimalString = (value: number) => {
	const decimal = value / 100;
	const formatted = decimal.toFixed(2);
	return Object.is(decimal, -0) ? "0.00" : formatted;
};

const splitAmount = (totalCents: number, parts: number) => {
	if (parts <= 0) {
		return [];
	}

	const base = Math.trunc(totalCents / parts);
	const remainder = totalCents % parts;

	return Array.from(
		{ length: parts },
		(_, index) => base + (index < remainder ? 1 : 0),
	);
};

const addMonthsToPeriod = (period: string, offset: number) => {
	const [yearStr, monthStr] = period.split("-");
	const baseYear = Number(yearStr);
	const baseMonth = Number(monthStr);

	if (!baseYear || !baseMonth) {
		throw new Error("Período inválido.");
	}

	const date = new Date(baseYear, baseMonth - 1, 1);
	date.setMonth(date.getMonth() + offset);

	const nextYear = date.getFullYear();
	const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
	return `${nextYear}-${nextMonth}`;
};

const addMonthsToDate = (value: Date, offset: number) => {
	const result = new Date(value);
	const originalDay = result.getDate();

	result.setDate(1);
	result.setMonth(result.getMonth() + offset);

	const lastDay = new Date(
		result.getFullYear(),
		result.getMonth() + 1,
		0,
	).getDate();

	result.setDate(Math.min(originalDay, lastDay));
	return result;
};

type Share = {
	pagadorId: string | null;
	amountCents: number;
};

const buildShares = ({
	totalCents,
	pagadorId,
	isSplit,
	secondaryPagadorId,
	primarySplitAmountCents,
	secondarySplitAmountCents,
}: {
	totalCents: number;
	pagadorId: string | null;
	isSplit: boolean;
	secondaryPagadorId?: string;
	primarySplitAmountCents?: number;
	secondarySplitAmountCents?: number;
}): Share[] => {
	if (isSplit) {
		if (!pagadorId || !secondaryPagadorId) {
			throw new Error("Configuração de divisão inválida para o lançamento.");
		}

		// Use custom split amounts if provided
		if (
			primarySplitAmountCents !== undefined &&
			secondarySplitAmountCents !== undefined
		) {
			return [
				{ pagadorId, amountCents: primarySplitAmountCents },
				{
					pagadorId: secondaryPagadorId,
					amountCents: secondarySplitAmountCents,
				},
			];
		}

		// Fallback to equal split
		const [primaryAmount, secondaryAmount] = splitAmount(totalCents, 2);
		return [
			{ pagadorId, amountCents: primaryAmount },
			{ pagadorId: secondaryPagadorId, amountCents: secondaryAmount },
		];
	}

	return [{ pagadorId, amountCents: totalCents }];
};

type BuildLancamentoRecordsParams = {
	data: BaseInput;
	userId: string;
	period: string;
	purchaseDate: Date;
	dueDate: Date | null;
	boletoPaymentDate: Date | null;
	shares: Share[];
	amountSign: 1 | -1;
	shouldNullifySettled: boolean;
	seriesId: string | null;
};

type LancamentoInsert = typeof lancamentos.$inferInsert;

const buildLancamentoRecords = ({
	data,
	userId,
	period,
	purchaseDate,
	dueDate,
	boletoPaymentDate,
	shares,
	amountSign,
	shouldNullifySettled,
	seriesId,
}: BuildLancamentoRecordsParams): LancamentoInsert[] => {
	const records: LancamentoInsert[] = [];

	const basePayload = {
		name: data.name,
		transactionType: data.transactionType,
		condition: data.condition,
		paymentMethod: data.paymentMethod,
		note: data.note ?? null,
		contaId: data.contaId ?? null,
		cartaoId: data.cartaoId ?? null,
		categoriaId: data.categoriaId ?? null,
		recurrenceCount: null as number | null,
		installmentCount: null as number | null,
		currentInstallment: null as number | null,
		isDivided: data.isSplit ?? false,
		userId,
		seriesId,
	};

	const resolveSettledValue = (cycleIndex: number) => {
		if (shouldNullifySettled) {
			return null;
		}
		const initialSettled = data.isSettled ?? false;
		if (data.condition === "Parcelado" || data.condition === "Recorrente") {
			return cycleIndex === 0 ? initialSettled : false;
		}
		return initialSettled;
	};

	if (data.condition === "Parcelado") {
		const installmentTotal = data.installmentCount ?? 0;
		const amountsByShare = shares.map((share) =>
			splitAmount(share.amountCents, installmentTotal),
		);

		for (
			let installment = 0;
			installment < installmentTotal;
			installment += 1
		) {
			const installmentPeriod = addMonthsToPeriod(period, installment);
			const installmentDueDate = dueDate
				? addMonthsToDate(dueDate, installment)
				: null;

			shares.forEach((share, shareIndex) => {
				const amountCents = amountsByShare[shareIndex]?.[installment] ?? 0;
				const settled = resolveSettledValue(installment);
				records.push({
					...basePayload,
					amount: centsToDecimalString(amountCents * amountSign),
					pagadorId: share.pagadorId,
					purchaseDate: purchaseDate,
					period: installmentPeriod,
					isSettled: settled,
					installmentCount: installmentTotal,
					currentInstallment: installment + 1,
					recurrenceCount: null,
					dueDate: installmentDueDate,
					boletoPaymentDate:
						data.paymentMethod === "Boleto" && settled
							? boletoPaymentDate
							: null,
				});
			});
		}

		return records;
	}

	if (data.condition === "Recorrente") {
		const recurrenceTotal = data.recurrenceCount ?? 0;

		for (let index = 0; index < recurrenceTotal; index += 1) {
			const recurrencePeriod = addMonthsToPeriod(period, index);
			const recurrencePurchaseDate = addMonthsToDate(purchaseDate, index);
			const recurrenceDueDate = dueDate
				? addMonthsToDate(dueDate, index)
				: null;

			shares.forEach((share) => {
				const settled = resolveSettledValue(index);
				records.push({
					...basePayload,
					amount: centsToDecimalString(share.amountCents * amountSign),
					pagadorId: share.pagadorId,
					purchaseDate: recurrencePurchaseDate,
					period: recurrencePeriod,
					isSettled: settled,
					recurrenceCount: recurrenceTotal,
					dueDate: recurrenceDueDate,
					boletoPaymentDate:
						data.paymentMethod === "Boleto" && settled
							? boletoPaymentDate
							: null,
				});
			});
		}

		return records;
	}

	shares.forEach((share) => {
		const settled = resolveSettledValue(0);
		records.push({
			...basePayload,
			amount: centsToDecimalString(share.amountCents * amountSign),
			pagadorId: share.pagadorId,
			purchaseDate,
			period,
			isSettled: settled,
			dueDate,
			boletoPaymentDate:
				data.paymentMethod === "Boleto" && settled ? boletoPaymentDate : null,
		});
	});

	return records;
};

export async function createLancamentoAction(
	input: CreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createSchema.parse(input);

		// Validar propriedade dos recursos referenciados
		if (data.pagadorId) {
			const isValid = await validatePagadorOwnership(user.id, data.pagadorId);
			if (!isValid) {
				return {
					success: false,
					error: "Pagador não encontrado ou sem permissão.",
				};
			}
		}

		if (data.secondaryPagadorId) {
			const isValid = await validatePagadorOwnership(
				user.id,
				data.secondaryPagadorId,
			);
			if (!isValid) {
				return {
					success: false,
					error: "Pagador secundário não encontrado ou sem permissão.",
				};
			}
		}

		if (data.categoriaId) {
			const isValid = await validateCategoriaOwnership(
				user.id,
				data.categoriaId,
			);
			if (!isValid) {
				return { success: false, error: "Categoria não encontrada." };
			}
		}

		if (data.contaId) {
			const isValid = await validateContaOwnership(user.id, data.contaId);
			if (!isValid) {
				return { success: false, error: "Conta não encontrada." };
			}
		}

		if (data.cartaoId) {
			const isValid = await validateCartaoOwnership(user.id, data.cartaoId);
			if (!isValid) {
				return { success: false, error: "Cartão não encontrado." };
			}
		}

		const period = resolvePeriod(data.purchaseDate, data.period);
		const purchaseDate = parseLocalDateString(data.purchaseDate);
		const dueDate = data.dueDate ? parseLocalDateString(data.dueDate) : null;
		const shouldSetBoletoPaymentDate =
			data.paymentMethod === "Boleto" && (data.isSettled ?? false);
		const boletoPaymentDate = shouldSetBoletoPaymentDate
			? data.boletoPaymentDate
				? parseLocalDateString(data.boletoPaymentDate)
				: getTodayDate()
			: null;

		const amountSign: 1 | -1 = data.transactionType === "Despesa" ? -1 : 1;
		const totalCents = Math.round(Math.abs(data.amount) * 100);
		const shouldNullifySettled = data.paymentMethod === "Cartão de crédito";

		const shares = buildShares({
			totalCents,
			pagadorId: data.pagadorId ?? null,
			isSplit: data.isSplit ?? false,
			secondaryPagadorId: data.secondaryPagadorId,
			primarySplitAmountCents: data.primarySplitAmount
				? Math.round(data.primarySplitAmount * 100)
				: undefined,
			secondarySplitAmountCents: data.secondarySplitAmount
				? Math.round(data.secondarySplitAmount * 100)
				: undefined,
		});

		const isSeriesLancamento =
			data.condition === "Parcelado" || data.condition === "Recorrente";
		const seriesId = isSeriesLancamento ? randomUUID() : null;

		const records = buildLancamentoRecords({
			data,
			userId: user.id,
			period,
			purchaseDate,
			dueDate,
			shares,
			amountSign,
			shouldNullifySettled,
			boletoPaymentDate,
			seriesId,
		});

		if (!records.length) {
			throw new Error("Não foi possível criar os lançamentos solicitados.");
		}

		await db.transaction(async (tx: typeof db) => {
			await tx.insert(lancamentos).values(records);
		});

		const notificationEntries = buildEntriesByPagador(
			records.map((record) => ({
				pagadorId: record.pagadorId ?? null,
				name: record.name ?? null,
				amount: record.amount ?? null,
				transactionType: record.transactionType ?? null,
				paymentMethod: record.paymentMethod ?? null,
				condition: record.condition ?? null,
				purchaseDate: record.purchaseDate ?? null,
				period: record.period ?? null,
				note: record.note ?? null,
			})),
		);

		if (notificationEntries.size > 0) {
			await sendPagadorAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "created",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate();

		return { success: true, message: "Lançamento criado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateLancamentoAction(
	input: UpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateSchema.parse(input);

		// Validar propriedade dos recursos referenciados
		if (data.pagadorId) {
			const isValid = await validatePagadorOwnership(user.id, data.pagadorId);
			if (!isValid) {
				return {
					success: false,
					error: "Pagador não encontrado ou sem permissão.",
				};
			}
		}

		if (data.secondaryPagadorId) {
			const isValid = await validatePagadorOwnership(
				user.id,
				data.secondaryPagadorId,
			);
			if (!isValid) {
				return {
					success: false,
					error: "Pagador secundário não encontrado ou sem permissão.",
				};
			}
		}

		if (data.categoriaId) {
			const isValid = await validateCategoriaOwnership(
				user.id,
				data.categoriaId,
			);
			if (!isValid) {
				return { success: false, error: "Categoria não encontrada." };
			}
		}

		if (data.contaId) {
			const isValid = await validateContaOwnership(user.id, data.contaId);
			if (!isValid) {
				return { success: false, error: "Conta não encontrada." };
			}
		}

		if (data.cartaoId) {
			const isValid = await validateCartaoOwnership(user.id, data.cartaoId);
			if (!isValid) {
				return { success: false, error: "Cartão não encontrado." };
			}
		}

		const existing = await db.query.lancamentos.findFirst({
			columns: {
				id: true,
				note: true,
				transactionType: true,
				condition: true,
				paymentMethod: true,
				contaId: true,
				categoriaId: true,
			},
			where: and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
			with: {
				categoria: {
					columns: {
						name: true,
					},
				},
			},
		});

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		// Bloquear edição de lançamentos com categorias protegidas
		// Nota: "Transferência interna" foi removida para permitir correção de valores
		const categoriasProtegidasEdicao = ["Saldo inicial", "Pagamentos"];
		if (
			existing.categoria?.name &&
			categoriasProtegidasEdicao.includes(existing.categoria.name)
		) {
			return {
				success: false,
				error: `Lançamentos com a categoria '${existing.categoria.name}' não podem ser editados.`,
			};
		}

		const period = resolvePeriod(data.purchaseDate, data.period);
		const amountSign: 1 | -1 = data.transactionType === "Despesa" ? -1 : 1;
		const amountCents = Math.round(Math.abs(data.amount) * 100);
		const normalizedAmount = centsToDecimalString(amountCents * amountSign);
		const normalizedSettled =
			data.paymentMethod === "Cartão de crédito"
				? null
				: (data.isSettled ?? false);
		const shouldSetBoletoPaymentDate =
			data.paymentMethod === "Boleto" && Boolean(normalizedSettled);
		const boletoPaymentDateValue = shouldSetBoletoPaymentDate
			? data.boletoPaymentDate
				? parseLocalDateString(data.boletoPaymentDate)
				: getTodayDate()
			: null;

		await db
			.update(lancamentos)
			.set({
				name: data.name,
				purchaseDate: parseLocalDateString(data.purchaseDate),
				transactionType: data.transactionType,
				amount: normalizedAmount,
				condition: data.condition,
				paymentMethod: data.paymentMethod,
				pagadorId: data.pagadorId ?? null,
				contaId: data.contaId ?? null,
				cartaoId: data.cartaoId ?? null,
				categoriaId: data.categoriaId ?? null,
				note: data.note ?? null,
				isSettled: normalizedSettled,
				installmentCount: data.installmentCount ?? null,
				recurrenceCount: data.recurrenceCount ?? null,
				dueDate: data.dueDate ? parseLocalDateString(data.dueDate) : null,
				boletoPaymentDate: boletoPaymentDateValue,
				period,
			})
			.where(and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)));

		if (isInitialBalanceLancamento(existing) && existing?.contaId) {
			const updatedInitialBalance = formatDecimalForDbRequired(
				Math.abs(data.amount ?? 0),
			);
			await db
				.update(contas)
				.set({ initialBalance: updatedInitialBalance })
				.where(
					and(eq(contas.id, existing.contaId), eq(contas.userId, user.id)),
				);
		}

		revalidate();

		return { success: true, message: "Lançamento atualizado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteLancamentoAction(
	input: DeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteSchema.parse(input);

		const existing = await db.query.lancamentos.findFirst({
			columns: {
				id: true,
				name: true,
				pagadorId: true,
				amount: true,
				transactionType: true,
				paymentMethod: true,
				condition: true,
				purchaseDate: true,
				period: true,
				note: true,
				categoriaId: true,
			},
			where: and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
			with: {
				categoria: {
					columns: {
						name: true,
					},
				},
			},
		});

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		// Bloquear remoção de lançamentos com categorias protegidas
		// Nota: "Transferência interna" foi removida para permitir correção/exclusão
		const categoriasProtegidasRemocao = ["Saldo inicial", "Pagamentos"];
		if (
			existing.categoria?.name &&
			categoriasProtegidasRemocao.includes(existing.categoria.name)
		) {
			return {
				success: false,
				error: `Lançamentos com a categoria '${existing.categoria.name}' não podem ser removidos.`,
			};
		}

		await db
			.delete(lancamentos)
			.where(and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)));

		if (existing.pagadorId) {
			const notificationEntries = buildEntriesByPagador([
				{
					pagadorId: existing.pagadorId,
					name: existing.name ?? null,
					amount: existing.amount ?? null,
					transactionType: existing.transactionType ?? null,
					paymentMethod: existing.paymentMethod ?? null,
					condition: existing.condition ?? null,
					purchaseDate: existing.purchaseDate ?? null,
					period: existing.period ?? null,
					note: existing.note ?? null,
				},
			]);

			await sendPagadorAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "deleted",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate();

		return { success: true, message: "Lançamento removido com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function toggleLancamentoSettlementAction(
	input: ToggleSettlementInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = toggleSettlementSchema.parse(input);

		const existing = await db.query.lancamentos.findFirst({
			columns: { id: true, paymentMethod: true },
			where: and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
		});

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		if (existing.paymentMethod === "Cartão de crédito") {
			return {
				success: false,
				error: "Pagamentos com cartão são conciliados automaticamente.",
			};
		}

		const isBoleto = existing.paymentMethod === "Boleto";
		const boletoPaymentDate = isBoleto
			? data.value
				? getTodayDate()
				: null
			: null;

		await db
			.update(lancamentos)
			.set({
				isSettled: data.value,
				boletoPaymentDate,
			})
			.where(and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)));

		revalidate();

		return {
			success: true,
			message: data.value
				? "Lançamento marcado como pago."
				: "Pagamento desfeito com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}

const deleteBulkSchema = z.object({
	id: uuidSchema("Lançamento"),
	scope: z.enum(["current", "future", "all"], {
		message: "Escopo de ação inválido.",
	}),
});

type DeleteBulkInput = z.infer<typeof deleteBulkSchema>;

export async function deleteLancamentoBulkAction(
	input: DeleteBulkInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteBulkSchema.parse(input);

		const existing = await db.query.lancamentos.findFirst({
			columns: {
				id: true,
				name: true,
				seriesId: true,
				period: true,
				condition: true,
			},
			where: and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
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
				.delete(lancamentos)
				.where(
					and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
				);

			revalidate();
			return { success: true, message: "Lançamento removido com sucesso." };
		}

		if (data.scope === "future") {
			await db
				.delete(lancamentos)
				.where(
					and(
						eq(lancamentos.seriesId, existing.seriesId),
						eq(lancamentos.userId, user.id),
						sql`${lancamentos.period} >= ${existing.period}`,
					),
				);

			revalidate();
			return {
				success: true,
				message: "Lançamentos removidos com sucesso.",
			};
		}

		if (data.scope === "all") {
			await db
				.delete(lancamentos)
				.where(
					and(
						eq(lancamentos.seriesId, existing.seriesId),
						eq(lancamentos.userId, user.id),
					),
				);

			revalidate();
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

const updateBulkSchema = z.object({
	id: uuidSchema("Lançamento"),
	scope: z.enum(["current", "future", "all"], {
		message: "Escopo de ação inválido.",
	}),
	name: z
		.string({ message: "Informe o estabelecimento." })
		.trim()
		.min(1, "Informe o estabelecimento."),
	categoriaId: uuidSchema("Categoria").nullable().optional(),
	note: noteSchema,
	pagadorId: uuidSchema("Pagador").nullable().optional(),
	contaId: uuidSchema("Conta").nullable().optional(),
	cartaoId: uuidSchema("Cartão").nullable().optional(),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero.")
		.optional(),
	dueDate: z
		.string()
		.trim()
		.refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
			message: "Informe uma data de vencimento válida.",
		})
		.optional()
		.nullable(),
	boletoPaymentDate: z
		.string()
		.trim()
		.refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
			message: "Informe uma data de pagamento válida.",
		})
		.optional()
		.nullable(),
});

type UpdateBulkInput = z.infer<typeof updateBulkSchema>;

export async function updateLancamentoBulkAction(
	input: UpdateBulkInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateBulkSchema.parse(input);

		const existing = await db.query.lancamentos.findFirst({
			columns: {
				id: true,
				name: true,
				seriesId: true,
				period: true,
				condition: true,
				transactionType: true,
				purchaseDate: true,
			},
			where: and(eq(lancamentos.id, data.id), eq(lancamentos.userId, user.id)),
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
			categoriaId: data.categoriaId ?? null,
			note: data.note ?? null,
			pagadorId: data.pagadorId ?? null,
			contaId: data.contaId ?? null,
			cartaoId: data.cartaoId ?? null,
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

		const applyUpdates = async (
			records: Array<{ id: string; purchaseDate: Date | null }>,
		) => {
			if (records.length === 0) {
				return;
			}

			await db.transaction(async (tx: typeof db) => {
				for (const record of records) {
					const perRecordPayload: Record<string, unknown> = {
						...baseUpdatePayload,
					};

					const dueDateForRecord = buildDueDateForRecord(record.purchaseDate);
					if (dueDateForRecord !== undefined) {
						perRecordPayload.dueDate = dueDateForRecord;
					}

					if (hasBoletoPaymentDateUpdate) {
						perRecordPayload.boletoPaymentDate = baseBoletoPaymentDate ?? null;
					}

					await tx
						.update(lancamentos)
						.set(perRecordPayload)
						.where(
							and(
								eq(lancamentos.id, record.id),
								eq(lancamentos.userId, user.id),
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

			revalidate();
			return { success: true, message: "Lançamento atualizado com sucesso." };
		}

		if (data.scope === "future") {
			const futureLancamentos = await db.query.lancamentos.findMany({
				columns: {
					id: true,
					purchaseDate: true,
				},
				where: and(
					eq(lancamentos.seriesId, existing.seriesId),
					eq(lancamentos.userId, user.id),
					sql`${lancamentos.period} >= ${existing.period}`,
				),
				orderBy: asc(lancamentos.purchaseDate),
			});

			await applyUpdates(
				futureLancamentos.map((item) => ({
					id: item.id,
					purchaseDate: item.purchaseDate ?? null,
				})),
			);

			revalidate();
			return {
				success: true,
				message: "Lançamentos atualizados com sucesso.",
			};
		}

		if (data.scope === "all") {
			const allLancamentos = await db.query.lancamentos.findMany({
				columns: {
					id: true,
					purchaseDate: true,
				},
				where: and(
					eq(lancamentos.seriesId, existing.seriesId),
					eq(lancamentos.userId, user.id),
				),
				orderBy: asc(lancamentos.purchaseDate),
			});

			await applyUpdates(
				allLancamentos.map((item) => ({
					id: item.id,
					purchaseDate: item.purchaseDate ?? null,
				})),
			);

			revalidate();
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

// Mass Add Schema
const massAddTransactionSchema = z.object({
	purchaseDate: z
		.string({ message: "Informe a data da transação." })
		.trim()
		.refine((value) => !Number.isNaN(new Date(value).getTime()), {
			message: "Data da transação inválida.",
		}),
	name: z
		.string({ message: "Informe o estabelecimento." })
		.trim()
		.min(1, "Informe o estabelecimento."),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero."),
	categoriaId: uuidSchema("Categoria").nullable().optional(),
	pagadorId: uuidSchema("Pagador").nullable().optional(),
});

const massAddSchema = z.object({
	fixedFields: z.object({
		transactionType: z.enum(LANCAMENTO_TRANSACTION_TYPES).optional(),
		paymentMethod: z.enum(LANCAMENTO_PAYMENT_METHODS).optional(),
		condition: z.enum(LANCAMENTO_CONDITIONS).optional(),
		period: z
			.string()
			.trim()
			.regex(/^(\d{4})-(\d{2})$/, {
				message: "Selecione um período válido.",
			})
			.optional(),
		contaId: uuidSchema("Conta").nullable().optional(),
		cartaoId: uuidSchema("Cartão").nullable().optional(),
	}),
	transactions: z
		.array(massAddTransactionSchema)
		.min(1, "Adicione pelo menos uma transação."),
});

type MassAddInput = z.infer<typeof massAddSchema>;

export async function createMassLancamentosAction(
	input: MassAddInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = massAddSchema.parse(input);

		// Validar campos fixos
		if (data.fixedFields.contaId) {
			const isValid = await validateContaOwnership(
				user.id,
				data.fixedFields.contaId,
			);
			if (!isValid) {
				return { success: false, error: "Conta não encontrada." };
			}
		}

		if (data.fixedFields.cartaoId) {
			const isValid = await validateCartaoOwnership(
				user.id,
				data.fixedFields.cartaoId,
			);
			if (!isValid) {
				return { success: false, error: "Cartão não encontrado." };
			}
		}

		// Validar cada transação individual
		for (let i = 0; i < data.transactions.length; i++) {
			const transaction = data.transactions[i];

			if (transaction.pagadorId) {
				const isValid = await validatePagadorOwnership(
					user.id,
					transaction.pagadorId,
				);
				if (!isValid) {
					return {
						success: false,
						error: `Pagador não encontrado na transação ${i + 1}.`,
					};
				}
			}

			if (transaction.categoriaId) {
				const isValid = await validateCategoriaOwnership(
					user.id,
					transaction.categoriaId,
				);
				if (!isValid) {
					return {
						success: false,
						error: `Categoria não encontrada na transação ${i + 1}.`,
					};
				}
			}
		}

		// Default values for non-fixed fields
		const defaultTransactionType = LANCAMENTO_TRANSACTION_TYPES[0];
		const defaultCondition = LANCAMENTO_CONDITIONS[0];
		const defaultPaymentMethod = LANCAMENTO_PAYMENT_METHODS[0];

		const allRecords: LancamentoInsert[] = [];
		const notificationData: Array<{
			pagadorId: string | null;
			name: string | null;
			amount: string | null;
			transactionType: string | null;
			paymentMethod: string | null;
			condition: string | null;
			purchaseDate: Date | null;
			period: string | null;
			note: string | null;
		}> = [];

		// Process each transaction
		for (const transaction of data.transactions) {
			const transactionType =
				data.fixedFields.transactionType ?? defaultTransactionType;
			const condition = data.fixedFields.condition ?? defaultCondition;
			const paymentMethod =
				data.fixedFields.paymentMethod ?? defaultPaymentMethod;
			const pagadorId = transaction.pagadorId ?? null;
			const contaId =
				paymentMethod === "Cartão de crédito"
					? null
					: (data.fixedFields.contaId ?? null);
			const cartaoId =
				paymentMethod === "Cartão de crédito"
					? (data.fixedFields.cartaoId ?? null)
					: null;
			const categoriaId = transaction.categoriaId ?? null;

			const period =
				data.fixedFields.period ?? resolvePeriod(transaction.purchaseDate);
			const purchaseDate = parseLocalDateString(transaction.purchaseDate);
			const amountSign: 1 | -1 = transactionType === "Despesa" ? -1 : 1;
			const totalCents = Math.round(Math.abs(transaction.amount) * 100);
			const amount = centsToDecimalString(totalCents * amountSign);
			const isSettled = paymentMethod === "Cartão de crédito" ? null : false;

			const record: LancamentoInsert = {
				name: transaction.name,
				purchaseDate,
				period,
				transactionType,
				amount,
				condition,
				paymentMethod,
				pagadorId,
				contaId,
				cartaoId,
				categoriaId,
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
				pagadorId,
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

		// Insert all records in a single transaction
		await db.transaction(async (tx: typeof db) => {
			await tx.insert(lancamentos).values(allRecords);
		});

		// Send notifications
		const notificationEntries = buildEntriesByPagador(notificationData);

		if (notificationEntries.size > 0) {
			await sendPagadorAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "created",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate();

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

// Delete multiple lancamentos at once
const deleteMultipleSchema = z.object({
	ids: z
		.array(uuidSchema("Lançamento"))
		.min(1, "Selecione pelo menos um lançamento."),
});

type DeleteMultipleInput = z.infer<typeof deleteMultipleSchema>;

export async function deleteMultipleLancamentosAction(
	input: DeleteMultipleInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteMultipleSchema.parse(input);

		// Fetch all lancamentos to be deleted
		const existing = await db.query.lancamentos.findMany({
			columns: {
				id: true,
				name: true,
				pagadorId: true,
				amount: true,
				transactionType: true,
				paymentMethod: true,
				condition: true,
				purchaseDate: true,
				period: true,
				note: true,
			},
			where: and(
				inArray(lancamentos.id, data.ids),
				eq(lancamentos.userId, user.id),
			),
		});

		if (existing.length === 0) {
			return { success: false, error: "Nenhum lançamento encontrado." };
		}

		// Delete all lancamentos
		await db
			.delete(lancamentos)
			.where(
				and(inArray(lancamentos.id, data.ids), eq(lancamentos.userId, user.id)),
			);

		// Send notifications
		const notificationData = existing
			.filter(
				(
					item,
				): item is typeof item & {
					pagadorId: NonNullable<typeof item.pagadorId>;
				} => Boolean(item.pagadorId),
			)
			.map((item) => ({
				pagadorId: item.pagadorId,
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
			const notificationEntries = buildEntriesByPagador(notificationData);

			await sendPagadorAutoEmails({
				userLabel: resolveUserLabel(user),
				action: "deleted",
				entriesByPagador: notificationEntries,
			});
		}

		revalidate();

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

// Get unique establishment names from the last 3 months
export async function getRecentEstablishmentsAction(): Promise<string[]> {
	try {
		const user = await getUser();

		// Calculate date 3 months ago
		const threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		// Fetch establishment names from the last 3 months
		const results = await db
			.select({ name: lancamentos.name })
			.from(lancamentos)
			.where(
				and(
					eq(lancamentos.userId, user.id),
					gte(lancamentos.purchaseDate, threeMonthsAgo),
				),
			)
			.orderBy(desc(lancamentos.purchaseDate));

		// Remove duplicates and filter empty names
		const uniqueNames = Array.from(
			new Set(
				results
					.map((r) => r.name)
					.filter(
						(name): name is string =>
							name != null &&
							name.trim().length > 0 &&
							!name.toLowerCase().startsWith("pagamento fatura"),
					),
			),
		);

		// Return top 50 most recent unique establishments
		return uniqueNames.slice(0, 100);
	} catch (error) {
		console.error("Error fetching recent establishments:", error);
		return [];
	}
}
