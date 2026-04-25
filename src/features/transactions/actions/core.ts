import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
	cards,
	categories,
	financialAccounts,
	invoices,
	payers,
	type transactions,
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
import { revalidateForEntity } from "@/shared/lib/actions/helpers";
import { db } from "@/shared/lib/db";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import { addMonthsToDate, parseLocalDateString } from "@/shared/utils/date";
import { addMonthsToPeriod, MONTH_NAMES } from "@/shared/utils/period";

// ============================================================================
// Authorization Validation Functions
// ============================================================================

export async function validatePagadorOwnership(
	userId: string,
	payerId: string | null | undefined,
): Promise<boolean> {
	if (!payerId) return true;

	const pagador = await db.query.payers.findFirst({
		where: and(eq(payers.id, payerId), eq(payers.userId, userId)),
	});

	return !!pagador;
}

const normalizeIds = (ids: Array<string | null | undefined>) => [
	...new Set(ids.filter((id): id is string => Boolean(id))),
];

export async function fetchOwnedPayerIds(
	userId: string,
	payerIds: Array<string | null | undefined>,
): Promise<Set<string>> {
	const ids = normalizeIds(payerIds);
	if (ids.length === 0) {
		return new Set();
	}

	const rows = await db
		.select({ id: payers.id })
		.from(payers)
		.where(and(eq(payers.userId, userId), inArray(payers.id, ids)));

	return new Set(rows.map((row) => row.id));
}

export async function validateCategoriaOwnership(
	userId: string,
	categoryId: string | null | undefined,
): Promise<boolean> {
	if (!categoryId) return true;

	const categoria = await db.query.categories.findFirst({
		where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
	});

	return !!categoria;
}

export async function fetchOwnedCategoryIds(
	userId: string,
	categoryIds: Array<string | null | undefined>,
): Promise<Set<string>> {
	const ids = normalizeIds(categoryIds);
	if (ids.length === 0) {
		return new Set();
	}

	const rows = await db
		.select({ id: categories.id })
		.from(categories)
		.where(and(eq(categories.userId, userId), inArray(categories.id, ids)));

	return new Set(rows.map((row) => row.id));
}

export async function validateContaOwnership(
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

export async function fetchOwnedAccountIds(
	userId: string,
	accountIds: Array<string | null | undefined>,
): Promise<Set<string>> {
	const ids = normalizeIds(accountIds);
	if (ids.length === 0) {
		return new Set();
	}

	const rows = await db
		.select({ id: financialAccounts.id })
		.from(financialAccounts)
		.where(
			and(
				eq(financialAccounts.userId, userId),
				inArray(financialAccounts.id, ids),
			),
		);

	return new Set(rows.map((row) => row.id));
}

export async function validateCartaoOwnership(
	userId: string,
	cardId: string | null | undefined,
): Promise<boolean> {
	if (!cardId) return true;

	const cartao = await db.query.cards.findFirst({
		where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
	});

	return !!cartao;
}

export async function fetchOwnedCardIds(
	userId: string,
	cardIds: Array<string | null | undefined>,
): Promise<Set<string>> {
	const ids = normalizeIds(cardIds);
	if (ids.length === 0) {
		return new Set();
	}

	const rows = await db
		.select({ id: cards.id })
		.from(cards)
		.where(and(eq(cards.userId, userId), inArray(cards.id, ids)));

	return new Set(rows.map((row) => row.id));
}

export async function validateAllOwnership(
	userId: string,
	fields: {
		payerId?: string | null;
		secondaryPayerId?: string | null;
		categoryId?: string | null;
		accountId?: string | null;
		cardId?: string | null;
	},
): Promise<string | null> {
	const [ownedPayerIds, ownedCategoryIds, ownedAccountIds, ownedCardIds] =
		await Promise.all([
			fetchOwnedPayerIds(userId, [fields.payerId, fields.secondaryPayerId]),
			fetchOwnedCategoryIds(userId, [fields.categoryId]),
			fetchOwnedAccountIds(userId, [fields.accountId]),
			fetchOwnedCardIds(userId, [fields.cardId]),
		]);

	const checks = [
		!fields.payerId || ownedPayerIds.has(fields.payerId),
		!fields.secondaryPayerId || ownedPayerIds.has(fields.secondaryPayerId),
		!fields.categoryId || ownedCategoryIds.has(fields.categoryId),
		!fields.accountId || ownedAccountIds.has(fields.accountId),
		!fields.cardId || ownedCardIds.has(fields.cardId),
	];

	const errors = [
		"Pessoa não encontrada ou sem permissão.",
		"Pessoa secundário não encontrado ou sem permissão.",
		"Categoria não encontrada.",
		"Conta não encontrada.",
		"Cartão não encontrado.",
	];

	for (let i = 0; i < checks.length; i++) {
		if (!checks[i]) return errors[i];
	}
	return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

export const resolvePeriod = (purchaseDate: string, period?: string | null) => {
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

export const isValidDateInput = (value: string) =>
	!Number.isNaN(parseLocalDateString(value).getTime());

export const baseFields = z.object({
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
				message: "Selecione a pessoa principal para dividir o lançamento.",
			});
		}

		if (!data.secondaryPayerId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPayerId"],
				message: "Selecione a pessoa secundário para dividir o lançamento.",
			});
		} else if (data.payerId && data.secondaryPayerId === data.payerId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["secondaryPayerId"],
				message: "Escolha uma pessoa diferente para dividir o lançamento.",
			});
		}

		if (
			data.primarySplitAmount !== undefined &&
			data.secondarySplitAmount !== undefined
		) {
			const sum = data.primarySplitAmount + data.secondarySplitAmount;
			const total = Math.abs(data.amount);
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

export const createSchema = baseFields
	.extend({
		importFromTransactionId: uuidSchema("Lançamento fonte").optional(),
	})
	.superRefine(refineLancamento);
export const updateSchema = baseFields
	.extend({
		id: uuidSchema("Lançamento"),
	})
	.superRefine(refineLancamento);

export const deleteSchema = z.object({
	id: uuidSchema("Lançamento"),
});

export const toggleSettlementSchema = z.object({
	id: uuidSchema("Lançamento"),
	value: z.boolean({
		message: "Informe o status de pagamento.",
	}),
});

export type BaseInput = z.infer<typeof baseFields>;
export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
export type DeleteInput = z.infer<typeof deleteSchema>;
export type ToggleSettlementInput = z.infer<typeof toggleSettlementSchema>;

export const revalidate = (userId: string) =>
	revalidateForEntity("transactions", userId);

export const resolveUserLabel = (user: {
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

export const isInitialBalanceLancamento = (record?: InitialCandidate | null) =>
	!!record &&
	record.note === INITIAL_BALANCE_NOTE &&
	record.transactionType === INITIAL_BALANCE_TRANSACTION_TYPE &&
	record.condition === INITIAL_BALANCE_CONDITION &&
	record.paymentMethod === INITIAL_BALANCE_PAYMENT_METHOD;

export const centsToDecimalString = (value: number) => {
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

export type Share = {
	payerId: string | null;
	amountCents: number;
};

export const buildShares = ({
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

export type TransactionInsert = typeof transactions.$inferInsert;

export const buildLancamentoRecords = ({
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
	const isSplit = (data.isSplit ?? false) && shares.length > 1;

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

	const cycleSplitGroupId = () => (isSplit ? randomUUID() : null);

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
			const splitGroupId = cycleSplitGroupId();

			shares.forEach((share, shareIndex) => {
				const amountCents = amountsByShare[shareIndex]?.[installment] ?? 0;
				const settled = resolveSettledValue(installment);
				records.push({
					...basePayload,
					amount: centsToDecimalString(amountCents * amountSign),
					payerId: share.payerId,
					purchaseDate,
					period: installmentPeriod,
					isSettled: settled,
					installmentCount: installmentTotal,
					currentInstallment: installment + 1,
					recurrenceCount: null,
					dueDate: installmentDueDate,
					splitGroupId,
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
			const splitGroupId = cycleSplitGroupId();

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
					splitGroupId,
					boletoPaymentDate:
						data.paymentMethod === "Boleto" && settled
							? boletoPaymentDate
							: null,
				});
			});
		}

		return records;
	}

	const splitGroupId = cycleSplitGroupId();

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
			splitGroupId,
			boletoPaymentDate:
				data.paymentMethod === "Boleto" && settled ? boletoPaymentDate : null,
		});
	});

	return records;
};

export const formatPaidInvoicePeriods = (periods: string[]) =>
	periods
		.map((period) => {
			const [year, month] = period.split("-");
			const monthName = MONTH_NAMES[Number(month) - 1] ?? month;
			return `${monthName}/${year}`;
		})
		.join(", ");

export async function getPaidInvoicePeriods(
	userId: string,
	cardId: string,
	periods: string[],
) {
	if (periods.length === 0) {
		return [];
	}

	const rows = await db.query.invoices.findMany({
		columns: { period: true },
		where: and(
			eq(invoices.userId, userId),
			eq(invoices.cardId, cardId),
			eq(invoices.paymentStatus, INVOICE_PAYMENT_STATUS.PAID),
			inArray(invoices.period, periods),
		),
	});

	return [
		...new Set(
			rows
				.map((row) => row.period)
				.filter((period): period is string => Boolean(period)),
		),
	];
}

export const deleteBulkSchema = z.object({
	id: uuidSchema("Lançamento"),
	scope: z.enum(["current", "period", "future", "all"], {
		message: "Escopo de ação inválido.",
	}),
});

export type DeleteBulkInput = z.infer<typeof deleteBulkSchema>;

export const updateBulkSchema = z.object({
	id: uuidSchema("Lançamento"),
	scope: z.enum(["current", "period", "future", "all"], {
		message: "Escopo de ação inválido.",
	}),
	purchaseDate: z
		.string()
		.trim()
		.refine((value) => !value || isValidDateInput(value), {
			message: "Data da transação inválida.",
		})
		.optional(),
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
	isSettled: z.boolean().nullable().optional(),
});

export type UpdateBulkInput = z.infer<typeof updateBulkSchema>;

export const massAddTransactionSchema = z.object({
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

export const massAddSchema = z.object({
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

export type MassAddInput = z.infer<typeof massAddSchema>;

export const deleteMultipleSchema = z.object({
	ids: z
		.array(uuidSchema("Lançamento"))
		.min(1, "Selecione pelo menos um lançamento."),
});

export type DeleteMultipleInput = z.infer<typeof deleteMultipleSchema>;
