"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { categories, financialAccounts, transactions } from "@/db/schema";
import {
	INITIAL_BALANCE_CATEGORY_NAME,
	INITIAL_BALANCE_CONDITION,
	INITIAL_BALANCE_NOTE,
	INITIAL_BALANCE_PAYMENT_METHOD,
	INITIAL_BALANCE_TRANSACTION_TYPE,
} from "@/shared/lib/accounts/constants";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import {
	TRANSFER_CATEGORY_NAME,
	TRANSFER_CONDITION,
	TRANSFER_ESTABLISHMENT_ENTRADA,
	TRANSFER_ESTABLISHMENT_SAIDA,
	TRANSFER_PAYMENT_METHOD,
} from "@/shared/lib/transfers/constants";
import { formatDecimalForDbRequired } from "@/shared/utils/currency";
import { getTodayInfo } from "@/shared/utils/date";
import { normalizeFilePath } from "@/shared/utils/string";

const accountBaseSchema = z.object({
	name: z
		.string({ message: "Informe o nome da conta." })
		.trim()
		.min(1, "Informe o nome da conta."),
	accountType: z
		.string({ message: "Informe o tipo da conta." })
		.trim()
		.min(1, "Informe o tipo da conta."),
	status: z
		.string({ message: "Informe o status da conta." })
		.trim()
		.min(1, "Informe o status da conta."),
	note: noteSchema,
	logo: z
		.string({ message: "Selecione um logo." })
		.trim()
		.min(1, "Selecione um logo."),
	initialBalance: z.union([
		z.number(),
		z
			.string()
			.trim()
			.transform((value) =>
				value.length === 0 ? "0" : value.replace(",", "."),
			)
			.refine(
				(value) => !Number.isNaN(Number.parseFloat(value)),
				"Informe um saldo inicial válido.",
			)
			.transform((value) => Number.parseFloat(value)),
	]),
	excludeFromBalance: z
		.union([z.boolean(), z.string()])
		.transform((value) => value === true || value === "true"),
	excludeInitialBalanceFromIncome: z
		.union([z.boolean(), z.string()])
		.transform((value) => value === true || value === "true"),
});

const createAccountSchema = accountBaseSchema;
const updateAccountSchema = accountBaseSchema.extend({
	id: uuidSchema("FinancialAccount"),
});
const deleteAccountSchema = z.object({
	id: uuidSchema("FinancialAccount"),
});

type AccountCreateInput = z.infer<typeof createAccountSchema>;
type AccountUpdateInput = z.infer<typeof updateAccountSchema>;
type AccountDeleteInput = z.infer<typeof deleteAccountSchema>;

export async function createAccountAction(
	input: AccountCreateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = createAccountSchema.parse(input);

		const logoFile = normalizeFilePath(data.logo);

		const normalizedInitialBalance = Math.abs(data.initialBalance);
		const hasInitialBalance = normalizedInitialBalance > 0;
		const adminPayerId = hasInitialBalance
			? await getAdminPayerId(user.id)
			: null;

		if (hasInitialBalance && !adminPayerId) {
			throw new Error(
				"Pagador com papel administrador não encontrado. Crie um pagador admin antes de definir um saldo inicial.",
			);
		}

		await db.transaction(async (tx: typeof db) => {
			const [createdAccount] = await tx
				.insert(financialAccounts)
				.values({
					name: data.name,
					accountType: data.accountType,
					status: data.status,
					note: data.note ?? null,
					logo: logoFile,
					initialBalance: formatDecimalForDbRequired(data.initialBalance),
					excludeFromBalance: data.excludeFromBalance,
					excludeInitialBalanceFromIncome: data.excludeInitialBalanceFromIncome,
					userId: user.id,
				})
				.returning({ id: financialAccounts.id, name: financialAccounts.name });

			if (!createdAccount) {
				throw new Error("Não foi possível criar a conta.");
			}

			if (!hasInitialBalance) {
				return;
			}

			const [category] = await Promise.all([
				tx.query.categories.findFirst({
					columns: { id: true },
					where: and(
						eq(categories.userId, user.id),
						eq(categories.name, INITIAL_BALANCE_CATEGORY_NAME),
					),
				}),
			]);

			if (!category) {
				throw new Error(
					'Category "Saldo inicial" não encontrada. Crie-a antes de definir um saldo inicial.',
				);
			}

			const { date, period } = getTodayInfo();

			await tx.insert(transactions).values({
				condition: INITIAL_BALANCE_CONDITION,
				name: `Saldo inicial - ${createdAccount.name}`,
				paymentMethod: INITIAL_BALANCE_PAYMENT_METHOD,
				note: INITIAL_BALANCE_NOTE,
				amount: formatDecimalForDbRequired(normalizedInitialBalance),
				purchaseDate: date,
				transactionType: INITIAL_BALANCE_TRANSACTION_TYPE,
				period,
				isSettled: true,
				userId: user.id,
				accountId: createdAccount.id,
				categoryId: category.id,
				payerId: adminPayerId,
			});
		});

		revalidateForEntity("accounts", user.id);

		return {
			success: true,
			message: "Conta criada com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateAccountAction(
	input: AccountUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateAccountSchema.parse(input);

		const logoFile = normalizeFilePath(data.logo);

		const [updated] = await db
			.update(financialAccounts)
			.set({
				name: data.name,
				accountType: data.accountType,
				status: data.status,
				note: data.note ?? null,
				logo: logoFile,
				initialBalance: formatDecimalForDbRequired(data.initialBalance),
				excludeFromBalance: data.excludeFromBalance,
				excludeInitialBalanceFromIncome: data.excludeInitialBalanceFromIncome,
			})
			.where(
				and(
					eq(financialAccounts.id, data.id),
					eq(financialAccounts.userId, user.id),
				),
			)
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Conta não encontrada.",
			};
		}

		revalidateForEntity("accounts", user.id);

		return {
			success: true,
			message: "Conta atualizada com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteAccountAction(
	input: AccountDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteAccountSchema.parse(input);

		const [deleted] = await db
			.delete(financialAccounts)
			.where(
				and(
					eq(financialAccounts.id, data.id),
					eq(financialAccounts.userId, user.id),
				),
			)
			.returning({ id: financialAccounts.id });

		if (!deleted) {
			return {
				success: false,
				error: "Conta não encontrada.",
			};
		}

		revalidateForEntity("accounts", user.id);

		return {
			success: true,
			message: "Conta removida com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}

// Transfer between accounts
const transferSchema = z.object({
	fromAccountId: uuidSchema("Conta de origem"),
	toAccountId: uuidSchema("Conta de destino"),
	amount: z
		.string()
		.trim()
		.transform((value) => (value.length === 0 ? "0" : value.replace(",", ".")))
		.refine(
			(value) => !Number.isNaN(Number.parseFloat(value)),
			"Informe um valor válido.",
		)
		.transform((value) => Number.parseFloat(value))
		.refine((value) => value > 0, "O valor deve ser maior que zero."),
	date: z.coerce.date({ message: "Informe uma data válida." }),
	period: z
		.string({ message: "Informe o período." })
		.trim()
		.min(1, "Informe o período."),
});

type TransferInput = z.input<typeof transferSchema>;

export async function transferBetweenAccountsAction(
	input: TransferInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = transferSchema.parse(input);

		// Validate that accounts are different
		if (data.fromAccountId === data.toAccountId) {
			return {
				success: false,
				error: "A conta de origem e destino devem ser diferentes.",
			};
		}

		// Generate a unique transfer ID to link both transactions
		const transferId = crypto.randomUUID();
		const adminPayerId = await getAdminPayerId(user.id);

		if (!adminPayerId) {
			throw new Error(
				"Pagador administrador não encontrado. Por favor, crie um pagador admin.",
			);
		}

		await db.transaction(async (tx: typeof db) => {
			// Verify both accounts exist and belong to the user
			const [fromAccount, toAccount] = await Promise.all([
				tx.query.financialAccounts.findFirst({
					columns: { id: true, name: true },
					where: and(
						eq(financialAccounts.id, data.fromAccountId),
						eq(financialAccounts.userId, user.id),
					),
				}),
				tx.query.financialAccounts.findFirst({
					columns: { id: true, name: true },
					where: and(
						eq(financialAccounts.id, data.toAccountId),
						eq(financialAccounts.userId, user.id),
					),
				}),
			]);

			if (!fromAccount) {
				throw new Error("Conta de origem não encontrada.");
			}

			if (!toAccount) {
				throw new Error("Conta de destino não encontrada.");
			}

			// Get the transfer category and admin payer in parallel
			const [transferCategory] = await Promise.all([
				tx.query.categories.findFirst({
					columns: { id: true },
					where: and(
						eq(categories.userId, user.id),
						eq(categories.name, TRANSFER_CATEGORY_NAME),
					),
				}),
			]);

			if (!transferCategory) {
				throw new Error(
					`Category "${TRANSFER_CATEGORY_NAME}" não encontrada. Por favor, crie esta categoria antes de fazer transferências.`,
				);
			}

			const transferNote = `de ${fromAccount.name} -> ${toAccount.name}`;

			const sharedFields = {
				condition: TRANSFER_CONDITION,
				paymentMethod: TRANSFER_PAYMENT_METHOD,
				note: transferNote,
				purchaseDate: data.date,
				transactionType: "Transferência" as const,
				period: data.period,
				isSettled: true,
				userId: user.id,
				categoryId: transferCategory.id,
				payerId: adminPayerId,
				transferId,
			};

			// Create both transactions in a single batch insert
			await tx.insert(transactions).values([
				{
					...sharedFields,
					name: TRANSFER_ESTABLISHMENT_SAIDA,
					amount: formatDecimalForDbRequired(-Math.abs(data.amount)),
					accountId: fromAccount.id,
				},
				{
					...sharedFields,
					name: TRANSFER_ESTABLISHMENT_ENTRADA,
					amount: formatDecimalForDbRequired(Math.abs(data.amount)),
					accountId: toAccount.id,
				},
			]);
		});

		revalidateForEntity("accounts", user.id);
		revalidateForEntity("transactions", user.id);

		return {
			success: true,
			message: "Transferência registrada com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}
