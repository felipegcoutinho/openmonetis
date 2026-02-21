"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { categorias, contas, lancamentos, pagadores } from "@/db/schema";
import {
	INITIAL_BALANCE_CATEGORY_NAME,
	INITIAL_BALANCE_CONDITION,
	INITIAL_BALANCE_NOTE,
	INITIAL_BALANCE_PAYMENT_METHOD,
	INITIAL_BALANCE_TRANSACTION_TYPE,
} from "@/lib/accounts/constants";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/lib/actions/helpers";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { noteSchema, uuidSchema } from "@/lib/schemas/common";
import {
	TRANSFER_CATEGORY_NAME,
	TRANSFER_CONDITION,
	TRANSFER_ESTABLISHMENT_ENTRADA,
	TRANSFER_ESTABLISHMENT_SAIDA,
	TRANSFER_PAYMENT_METHOD,
} from "@/lib/transferencias/constants";
import { formatDecimalForDbRequired } from "@/lib/utils/currency";
import { getTodayInfo } from "@/lib/utils/date";
import { normalizeFilePath } from "@/lib/utils/string";

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
	initialBalance: z
		.string()
		.trim()
		.transform((value) => (value.length === 0 ? "0" : value.replace(",", ".")))
		.refine(
			(value) => !Number.isNaN(Number.parseFloat(value)),
			"Informe um saldo inicial válido.",
		)
		.transform((value) => Number.parseFloat(value)),
	excludeFromBalance: z
		.union([z.boolean(), z.string()])
		.transform((value) => value === true || value === "true"),
	excludeInitialBalanceFromIncome: z
		.union([z.boolean(), z.string()])
		.transform((value) => value === true || value === "true"),
});

const createAccountSchema = accountBaseSchema;
const updateAccountSchema = accountBaseSchema.extend({
	id: uuidSchema("Conta"),
});
const deleteAccountSchema = z.object({
	id: uuidSchema("Conta"),
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

		await db.transaction(async (tx: typeof db) => {
			const [createdAccount] = await tx
				.insert(contas)
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
				.returning({ id: contas.id, name: contas.name });

			if (!createdAccount) {
				throw new Error("Não foi possível criar a conta.");
			}

			if (!hasInitialBalance) {
				return;
			}

			const [category, adminPagador] = await Promise.all([
				tx.query.categorias.findFirst({
					columns: { id: true },
					where: and(
						eq(categorias.userId, user.id),
						eq(categorias.name, INITIAL_BALANCE_CATEGORY_NAME),
					),
				}),
				tx.query.pagadores.findFirst({
					columns: { id: true },
					where: and(
						eq(pagadores.userId, user.id),
						eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					),
				}),
			]);

			if (!category) {
				throw new Error(
					'Categoria "Saldo inicial" não encontrada. Crie-a antes de definir um saldo inicial.',
				);
			}

			if (!adminPagador) {
				throw new Error(
					"Pagador com papel administrador não encontrado. Crie um pagador admin antes de definir um saldo inicial.",
				);
			}

			const { date, period } = getTodayInfo();

			await tx.insert(lancamentos).values({
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
				contaId: createdAccount.id,
				categoriaId: category.id,
				pagadorId: adminPagador.id,
			});
		});

		revalidateForEntity("contas");

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
			.update(contas)
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
			.where(and(eq(contas.id, data.id), eq(contas.userId, user.id)))
			.returning();

		if (!updated) {
			return {
				success: false,
				error: "Conta não encontrada.",
			};
		}

		revalidateForEntity("contas");

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
			.delete(contas)
			.where(and(eq(contas.id, data.id), eq(contas.userId, user.id)))
			.returning({ id: contas.id });

		if (!deleted) {
			return {
				success: false,
				error: "Conta não encontrada.",
			};
		}

		revalidateForEntity("contas");

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

type TransferInput = z.infer<typeof transferSchema>;

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

		await db.transaction(async (tx: typeof db) => {
			// Verify both accounts exist and belong to the user
			const [fromAccount, toAccount] = await Promise.all([
				tx.query.contas.findFirst({
					columns: { id: true, name: true },
					where: and(
						eq(contas.id, data.fromAccountId),
						eq(contas.userId, user.id),
					),
				}),
				tx.query.contas.findFirst({
					columns: { id: true, name: true },
					where: and(
						eq(contas.id, data.toAccountId),
						eq(contas.userId, user.id),
					),
				}),
			]);

			if (!fromAccount) {
				throw new Error("Conta de origem não encontrada.");
			}

			if (!toAccount) {
				throw new Error("Conta de destino não encontrada.");
			}

			// Get the transfer category
			const transferCategory = await tx.query.categorias.findFirst({
				columns: { id: true },
				where: and(
					eq(categorias.userId, user.id),
					eq(categorias.name, TRANSFER_CATEGORY_NAME),
				),
			});

			if (!transferCategory) {
				throw new Error(
					`Categoria "${TRANSFER_CATEGORY_NAME}" não encontrada. Por favor, crie esta categoria antes de fazer transferências.`,
				);
			}

			// Get the admin payer
			const adminPagador = await tx.query.pagadores.findFirst({
				columns: { id: true },
				where: and(
					eq(pagadores.userId, user.id),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				),
			});

			if (!adminPagador) {
				throw new Error(
					"Pagador administrador não encontrado. Por favor, crie um pagador admin.",
				);
			}

			const transferNote = `de ${fromAccount.name} -> ${toAccount.name}`;

			// Create outgoing transaction (transfer from source account)
			await tx.insert(lancamentos).values({
				condition: TRANSFER_CONDITION,
				name: TRANSFER_ESTABLISHMENT_SAIDA,
				paymentMethod: TRANSFER_PAYMENT_METHOD,
				note: transferNote,
				amount: formatDecimalForDbRequired(-Math.abs(data.amount)),
				purchaseDate: data.date,
				transactionType: "Transferência",
				period: data.period,
				isSettled: true,
				userId: user.id,
				contaId: fromAccount.id,
				categoriaId: transferCategory.id,
				pagadorId: adminPagador.id,
				transferId,
			});

			// Create incoming transaction (transfer to destination account)
			await tx.insert(lancamentos).values({
				condition: TRANSFER_CONDITION,
				name: TRANSFER_ESTABLISHMENT_ENTRADA,
				paymentMethod: TRANSFER_PAYMENT_METHOD,
				note: transferNote,
				amount: formatDecimalForDbRequired(Math.abs(data.amount)),
				purchaseDate: data.date,
				transactionType: "Transferência",
				period: data.period,
				isSettled: true,
				userId: user.id,
				contaId: toAccount.id,
				categoriaId: transferCategory.id,
				pagadorId: adminPagador.id,
				transferId,
			});
		});

		revalidateForEntity("contas");
		revalidateForEntity("lancamentos");

		return {
			success: true,
			message: "Transferência registrada com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}
