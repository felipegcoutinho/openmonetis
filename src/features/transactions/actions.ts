"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
	cards,
	categories,
	financialAccounts,
	payers,
	transactions,
} from "@/db/schema";
import {
	PAYMENT_METHODS,
	TRANSACTION_CONDITIONS,
	TRANSACTION_TYPES,
} from "@/features/transactions/constants";
import {
	INITIAL_BALANCE_CONDITION,
	INITIAL_BALANCE_NOTE,
	INITIAL_BALANCE_PAYMENT_METHOD,
	INITIAL_BALANCE_TRANSACTION_TYPE,
} from "@/shared/lib/accounts/constants";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import {
	buildEntriesByPayer,
	sendPayerAutoEmails,
} from "@/shared/lib/payers/notifications";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import type { ActionResult } from "@/shared/lib/types/actions";
import { formatDecimalForDbRequired } from "@/shared/utils/currency";
import {
	getBusinessTodayDate,
	parseLocalDateString,
} from "@/shared/utils/date";
import { addMonthsToPeriod } from "@/shared/utils/period";

// ============================================================================
// Authorization Validation Functions
// ============================================================================

async function validatePagadorOwnership(
	userId: string,
	payerId: string | null | undefined,
): Promise<boolean> {
	if (!payerId) return true; // Se não tem payerId, não precisa validar

	const pagador = await db.query.payers.findFirst({
		where: and(eq(payers.id, payerId), eq(payers.userId, userId)),
	});

	return !!pagador;
}

async function validateCategoriaOwnership(
	userId: string,
	categoryId: string | null | undefined,
): Promise<boolean> {
	if (!categoryId) return true;

	const categoria = await db.query.categories.findFirst({
		where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
	});

	return !!categoria;
}

async function validateContaOwnership(
	userId: string,
	accountId: string | null | undefined,
): Promise<boolean> {
	if (!accountId) return true;

	const conta = await db.query.financialAccounts.findFirst({
		where: and(
			eq(financialAccounts.id, accountId),
			eq(financialAccounts.userId, userId),
		),
	});

	return !!conta;
}

async function validateCartaoOwnership(
	userId: string,
	cardId: string | null | undefined,
): Promise<boolean> {
	if (!cardId) return true;

	const cartao = await db.query.cards.findFirst({
		where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
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

const isValidDateInput = (value: string) =>
	!Number.isNaN(parseLocalDateString(value).getTime());

const baseFields = z.object({
	purchaseDate: z
		.string({ message: "Informe a data da transação." })
		.trim()
		.refine((value) => isValidDateInput(value), {
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
		.enum(TRANSACTION_TYPES, {
			message: "Selecione um tipo de transação válido.",
		})
		.default(TRANSACTION_TYPES[0]),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero."),
	condition: z.enum(TRANSACTION_CONDITIONS, {
		message: "Selecione uma condição válida.",
	}),
	paymentMethod: z.enum(PAYMENT_METHODS, {
		message: "Selecione uma forma de pagamento válida.",
	}),
	payerId: uuidSchema("Payer").nullable().optional(),
	secondaryPayerId: uuidSchema("Payer secundário").optional(),
	isSplit: z.boolean().optional().default(false),
	primarySplitAmount: z.coerce.number().min(0).optional(),
	secondarySplitAmount: z.coerce.number().min(0).optional(),
	accountId: uuidSchema("FinancialAccount").nullable().optional(),
	cardId: uuidSchema("Cartão").nullable().optional(),
	categoryId: uuidSchema("Category").nullable().optional(),
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
		.refine((value) => !value || isValidDateInput(value), {
			message: "Informe uma data de vencimento válida.",
		})
		.optional(),
	boletoPaymentDate: z
		.string()
		.trim()
		.refine((value) => !value || isValidDateInput(value), {
			message: "Informe uma data de pagamento válida.",
		})
		.optional(),
	isSettled: z.boolean().nullable().optional(),
});

const refineLancamento = (
	data: z.infer<typeof baseFields> & { id?: string },
	ctx: z.RefinementCtx,
) => {
	if (!data.categoryId) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["categoryId"],
			message: "Selecione uma categoria.",
		});
	}

	if (data.paymentMethod === "Cartão de crédito") {
		if (!data.cardId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["cardId"],
				message: "Selecione o cartão.",
			});
		}
	} else if (!data.accountId) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["accountId"],
			message: "Selecione a conta.",
		});
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

	if (data.isSplit) {
		if (!data.payerId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["payerId"],
				message: "Selecione o pagador principal para dividir o lançamento.",
			});
		}

		if (!data.secondaryPayerId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPayerId"],
				message: "Selecione o pagador secundário para dividir o lançamento.",
			});
		} else if (data.payerId && data.secondaryPayerId === data.payerId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPayerId"],
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

const revalidate = () => revalidateForEntity("transactions");

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
	return "OpenMonetis";
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
	payerId: string | null;
	amountCents: number;
};

const buildShares = ({
	totalCents,
	payerId,
	isSplit,
	secondaryPayerId,
	primarySplitAmountCents,
	secondarySplitAmountCents,
}: {
	totalCents: number;
	payerId: string | null;
	isSplit: boolean;
	secondaryPayerId?: string;
	primarySplitAmountCents?: number;
	secondarySplitAmountCents?: number;
}): Share[] => {
	if (isSplit) {
		if (!payerId || !secondaryPayerId) {
			throw new Error("Configuração de divisão inválida para o lançamento.");
		}

		// Use custom split amounts if provided
		if (
			primarySplitAmountCents !== undefined &&
			secondarySplitAmountCents !== undefined
		) {
			return [
				{ payerId, amountCents: primarySplitAmountCents },
				{
					payerId: secondaryPayerId,
					amountCents: secondarySplitAmountCents,
				},
			];
		}

		// Fallback to equal split
		const [primaryAmount, secondaryAmount] = splitAmount(totalCents, 2);
		return [
			{ payerId, amountCents: primaryAmount },
			{ payerId: secondaryPayerId, amountCents: secondaryAmount },
		];
	}

	return [{ payerId, amountCents: totalCents }];
};

type BuildTransactionRecordsParams = {
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

type TransactionInsert = typeof transactions.$inferInsert;

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
}: BuildTransactionRecordsParams): TransactionInsert[] => {
	const records: TransactionInsert[] = [];

	const basePayload = {
		name: data.name,
		transactionType: data.transactionType,
		condition: data.condition,
		paymentMethod: data.paymentMethod,
		note: data.note ?? null,
		accountId: data.accountId ?? null,
		cardId: data.cardId ?? null,
		categoryId: data.categoryId ?? null,
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
					payerId: share.payerId,
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
					payerId: share.payerId,
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
			payerId: share.payerId,
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

export async function createTransactionAction(
	input: CreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createSchema.parse(input);

		// Validar propriedade dos recursos referenciados
		if (data.payerId) {
			const isValid = await validatePagadorOwnership(user.id, data.payerId);
			if (!isValid) {
				return {
					success: false,
					error: "Payer não encontrado ou sem permissão.",
				};
			}
		}

		if (data.secondaryPayerId) {
			const isValid = await validatePagadorOwnership(
				user.id,
				data.secondaryPayerId,
			);
			if (!isValid) {
				return {
					success: false,
					error: "Payer secundário não encontrado ou sem permissão.",
				};
			}
		}

		if (data.categoryId) {
			const isValid = await validateCategoriaOwnership(
				user.id,
				data.categoryId,
			);
			if (!isValid) {
				return { success: false, error: "Category não encontrada." };
			}
		}

		if (data.accountId) {
			const isValid = await validateContaOwnership(user.id, data.accountId);
			if (!isValid) {
				return { success: false, error: "FinancialAccount não encontrada." };
			}
		}

		if (data.cardId) {
			const isValid = await validateCartaoOwnership(user.id, data.cardId);
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
				: getBusinessTodayDate()
			: null;

		const amountSign: 1 | -1 = data.transactionType === "Despesa" ? -1 : 1;
		const totalCents = Math.round(Math.abs(data.amount) * 100);
		const shouldNullifySettled = data.paymentMethod === "Cartão de crédito";

		const shares = buildShares({
			totalCents,
			payerId: data.payerId ?? null,
			isSplit: data.isSplit ?? false,
			secondaryPayerId: data.secondaryPayerId,
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

		await db.insert(transactions).values(records);

		const notificationEntries = buildEntriesByPayer(
			records.map((record) => ({
				payerId: record.payerId ?? null,
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
			await sendPayerAutoEmails({
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

export async function updateTransactionAction(
	input: UpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateSchema.parse(input);

		// Validar propriedade dos recursos referenciados
		if (data.payerId) {
			const isValid = await validatePagadorOwnership(user.id, data.payerId);
			if (!isValid) {
				return {
					success: false,
					error: "Payer não encontrado ou sem permissão.",
				};
			}
		}

		if (data.secondaryPayerId) {
			const isValid = await validatePagadorOwnership(
				user.id,
				data.secondaryPayerId,
			);
			if (!isValid) {
				return {
					success: false,
					error: "Payer secundário não encontrado ou sem permissão.",
				};
			}
		}

		if (data.categoryId) {
			const isValid = await validateCategoriaOwnership(
				user.id,
				data.categoryId,
			);
			if (!isValid) {
				return { success: false, error: "Category não encontrada." };
			}
		}

		if (data.accountId) {
			const isValid = await validateContaOwnership(user.id, data.accountId);
			if (!isValid) {
				return { success: false, error: "FinancialAccount não encontrada." };
			}
		}

		if (data.cardId) {
			const isValid = await validateCartaoOwnership(user.id, data.cardId);
			if (!isValid) {
				return { success: false, error: "Cartão não encontrado." };
			}
		}

		const existing = (await db.query.transactions.findFirst({
			columns: {
				id: true,
				note: true,
				transactionType: true,
				condition: true,
				paymentMethod: true,
				accountId: true,
				categoryId: true,
			},
			where: and(
				eq(transactions.id, data.id),
				eq(transactions.userId, user.id),
			),
			with: {
				category: {
					columns: {
						name: true,
					},
				},
			},
		})) as
			| {
					id: string;
					note: string | null;
					transactionType: string;
					condition: string;
					paymentMethod: string;
					accountId: string | null;
					categoryId: string | null;
					category: { name: string } | null;
			  }
			| undefined;

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		// Bloquear edição de lançamentos com categories protegidas
		// Nota: "Transferência interna" foi removida para permitir correção de valores
		const categoriasProtegidasEdicao = ["Saldo inicial", "Pagamentos"];
		if (
			existing.category?.name &&
			categoriasProtegidasEdicao.includes(existing.category.name)
		) {
			return {
				success: false,
				error: `Lançamentos com a categoria '${existing.category.name}' não podem ser editados.`,
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
				: getBusinessTodayDate()
			: null;

		await db
			.update(transactions)
			.set({
				name: data.name,
				purchaseDate: parseLocalDateString(data.purchaseDate),
				transactionType: data.transactionType,
				amount: normalizedAmount,
				condition: data.condition,
				paymentMethod: data.paymentMethod,
				payerId: data.payerId ?? null,
				accountId: data.accountId ?? null,
				cardId: data.cardId ?? null,
				categoryId: data.categoryId ?? null,
				note: data.note ?? null,
				isSettled: normalizedSettled,
				installmentCount: data.installmentCount ?? null,
				recurrenceCount: data.recurrenceCount ?? null,
				dueDate: data.dueDate ? parseLocalDateString(data.dueDate) : null,
				boletoPaymentDate: boletoPaymentDateValue,
				period,
			})
			.where(
				and(eq(transactions.id, data.id), eq(transactions.userId, user.id)),
			);

		if (isInitialBalanceLancamento(existing) && existing?.accountId) {
			const updatedInitialBalance = formatDecimalForDbRequired(
				Math.abs(data.amount ?? 0),
			);
			await db
				.update(financialAccounts)
				.set({ initialBalance: updatedInitialBalance })
				.where(
					and(
						eq(financialAccounts.id, existing.accountId),
						eq(financialAccounts.userId, user.id),
					),
				);
		}

		revalidate();

		return { success: true, message: "Lançamento atualizado com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteTransactionAction(
	input: DeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteSchema.parse(input);

		const existing = (await db.query.transactions.findFirst({
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
				categoryId: true,
			},
			where: and(
				eq(transactions.id, data.id),
				eq(transactions.userId, user.id),
			),
			with: {
				category: {
					columns: {
						name: true,
					},
				},
			},
		})) as
			| {
					id: string;
					name: string | null;
					payerId: string | null;
					amount: string | null;
					transactionType: string;
					paymentMethod: string;
					condition: string;
					purchaseDate: Date | null;
					period: string;
					note: string | null;
					categoryId: string | null;
					category: { name: string } | null;
			  }
			| undefined;

		if (!existing) {
			return { success: false, error: "Lançamento não encontrado." };
		}

		// Bloquear remoção de lançamentos com categories protegidas
		// Nota: "Transferência interna" foi removida para permitir correção/exclusão
		const categoriasProtegidasRemocao = ["Saldo inicial", "Pagamentos"];
		if (
			existing.category?.name &&
			categoriasProtegidasRemocao.includes(existing.category.name)
		) {
			return {
				success: false,
				error: `Lançamentos com a categoria '${existing.category.name}' não podem ser removidos.`,
			};
		}

		await db
			.delete(transactions)
			.where(
				and(eq(transactions.id, data.id), eq(transactions.userId, user.id)),
			);

		if (existing.payerId) {
			const notificationEntries = buildEntriesByPayer([
				{
					payerId: existing.payerId,
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

			await sendPayerAutoEmails({
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

export async function toggleTransactionSettlementAction(
	input: ToggleSettlementInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = toggleSettlementSchema.parse(input);

		const existing = await db.query.transactions.findFirst({
			columns: { id: true, paymentMethod: true },
			where: and(
				eq(transactions.id, data.id),
				eq(transactions.userId, user.id),
			),
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
				? getBusinessTodayDate()
				: null
			: null;

		await db
			.update(transactions)
			.set({
				isSettled: data.value,
				boletoPaymentDate,
			})
			.where(
				and(eq(transactions.id, data.id), eq(transactions.userId, user.id)),
			);

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

			revalidate();
			return { success: true, message: "Lançamento removido com sucesso." };
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

			revalidate();
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
	categoryId: uuidSchema("Category").nullable().optional(),
	note: noteSchema,
	payerId: uuidSchema("Payer").nullable().optional(),
	accountId: uuidSchema("FinancialAccount").nullable().optional(),
	cardId: uuidSchema("Cartão").nullable().optional(),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero.")
		.optional(),
	dueDate: z
		.string()
		.trim()
		.refine((value) => !value || isValidDateInput(value), {
			message: "Informe uma data de vencimento válida.",
		})
		.optional()
		.nullable(),
	boletoPaymentDate: z
		.string()
		.trim()
		.refine((value) => !value || isValidDateInput(value), {
			message: "Informe uma data de pagamento válida.",
		})
		.optional()
		.nullable(),
});

type UpdateBulkInput = z.infer<typeof updateBulkSchema>;

export async function updateTransactionBulkAction(
	input: UpdateBulkInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateBulkSchema.parse(input);

		const existing = await db.query.transactions.findFirst({
			columns: {
				id: true,
				name: true,
				seriesId: true,
				period: true,
				condition: true,
				transactionType: true,
				purchaseDate: true,
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
			payerId: data.payerId ?? null,
			accountId: data.accountId ?? null,
			cardId: data.cardId ?? null,
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
						.update(transactions)
						.set(perRecordPayload)
						.where(
							and(
								eq(transactions.id, record.id),
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

			revalidate();
			return { success: true, message: "Lançamento atualizado com sucesso." };
		}

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
				),
				orderBy: asc(transactions.purchaseDate),
			});

			await applyUpdates(
				futureLancamentos.map((item: (typeof futureLancamentos)[number]) => ({
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
			const allLancamentos = await db.query.transactions.findMany({
				columns: {
					id: true,
					purchaseDate: true,
				},
				where: and(
					eq(transactions.seriesId, existing.seriesId),
					eq(transactions.userId, user.id),
				),
				orderBy: asc(transactions.purchaseDate),
			});

			await applyUpdates(
				allLancamentos.map((item: (typeof allLancamentos)[number]) => ({
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
		.refine((value) => isValidDateInput(value), {
			message: "Data da transação inválida.",
		}),
	name: z
		.string({ message: "Informe o estabelecimento." })
		.trim()
		.min(1, "Informe o estabelecimento."),
	amount: z.coerce
		.number({ message: "Informe o valor da transação." })
		.min(0, "Informe um valor maior ou igual a zero."),
	categoryId: uuidSchema("Category").nullable().optional(),
	payerId: uuidSchema("Payer").nullable().optional(),
});

const massAddSchema = z.object({
	fixedFields: z.object({
		transactionType: z.enum(TRANSACTION_TYPES).optional(),
		paymentMethod: z.enum(PAYMENT_METHODS).optional(),
		condition: z.enum(TRANSACTION_CONDITIONS).optional(),
		period: z
			.string()
			.trim()
			.regex(/^(\d{4})-(\d{2})$/, {
				message: "Selecione um período válido.",
			})
			.optional(),
		accountId: uuidSchema("FinancialAccount").nullable().optional(),
		cardId: uuidSchema("Cartão").nullable().optional(),
	}),
	transactions: z
		.array(massAddTransactionSchema)
		.min(1, "Adicione pelo menos uma transação."),
});

type MassAddInput = z.infer<typeof massAddSchema>;

export async function createMassTransactionsAction(
	input: MassAddInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = massAddSchema.parse(input);

		// Validar campos fixos
		if (data.fixedFields.accountId) {
			const isValid = await validateContaOwnership(
				user.id,
				data.fixedFields.accountId,
			);
			if (!isValid) {
				return { success: false, error: "FinancialAccount não encontrada." };
			}
		}

		if (data.fixedFields.cardId) {
			const isValid = await validateCartaoOwnership(
				user.id,
				data.fixedFields.cardId,
			);
			if (!isValid) {
				return { success: false, error: "Cartão não encontrado." };
			}
		}

		// Validar cada transação individual
		for (let i = 0; i < data.transactions.length; i++) {
			const transaction = data.transactions[i];

			if (transaction.payerId) {
				const isValid = await validatePagadorOwnership(
					user.id,
					transaction.payerId,
				);
				if (!isValid) {
					return {
						success: false,
						error: `Payer não encontrado na transação ${i + 1}.`,
					};
				}
			}

			if (transaction.categoryId) {
				const isValid = await validateCategoriaOwnership(
					user.id,
					transaction.categoryId,
				);
				if (!isValid) {
					return {
						success: false,
						error: `Category não encontrada na transação ${i + 1}.`,
					};
				}
			}
		}

		// Default values for non-fixed fields
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

		// Process each transaction
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

		// Insert all records in a single transaction
		await db.transaction(async (tx: typeof db) => {
			await tx.insert(transactions).values(allRecords);
		});

		// Send notifications
		const notificationEntries = buildEntriesByPayer(notificationData);

		if (notificationEntries.size > 0) {
			await sendPayerAutoEmails({
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

// Delete multiple transactions at once
const deleteMultipleSchema = z.object({
	ids: z
		.array(uuidSchema("Lançamento"))
		.min(1, "Selecione pelo menos um lançamento."),
});

type DeleteMultipleInput = z.infer<typeof deleteMultipleSchema>;

export async function deleteMultipleTransactionsAction(
	input: DeleteMultipleInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteMultipleSchema.parse(input);

		// Fetch all transactions to be deleted
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

		// Delete all transactions
		await db
			.delete(transactions)
			.where(
				and(
					inArray(transactions.id, data.ids),
					eq(transactions.userId, user.id),
				),
			);

		// Send notifications
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
