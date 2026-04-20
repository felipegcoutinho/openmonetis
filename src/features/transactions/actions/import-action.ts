"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { transactions } from "@/db/schema";
import {
	validateCartaoOwnership,
	validateContaOwnership,
	validatePagadorOwnership,
} from "@/features/transactions/actions/core";
import { revalidateForEntity } from "@/shared/lib/actions/helpers";
import { getUserId } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { uuidSchema } from "@/shared/lib/schemas/common";
import { parseLocalDateString } from "@/shared/utils/date";

const importRowSchema = z.object({
	externalId: z.string().nullable(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
	amount: z.number().positive(),
	description: z.string().min(1, "Descrição obrigatória."),
	transactionType: z.enum(["income", "expense"]),
	categoryId: uuidSchema("Category").nullable().optional(),
});

const importSchema = z.object({
	rows: z.array(importRowSchema).min(1, "Selecione ao menos uma transação."),
	payerId: uuidSchema("Payer").nullable().optional(),
	accountId: uuidSchema("FinancialAccount").nullable().optional(),
	cardId: uuidSchema("Cartão").nullable().optional(),
	paymentMethod: z.string().min(1),
	invoicePeriod: z
		.string()
		.regex(/^\d{4}-\d{2}$/, "Período inválido.")
		.nullable()
		.optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportInput = z.infer<typeof importSchema>;

type ImportResult =
	| { success: true; imported: number; skipped: number; importBatchId: string }
	| { success: false; error: string };

// Retorna os externalIds que já existem para o usuário (para marcar duplicatas)
export async function checkDuplicateFitIds(
	fitIds: string[],
): Promise<string[]> {
	const userId = await getUserId();
	const ids = fitIds.filter(Boolean);
	if (ids.length === 0) return [];

	const rows = await db
		.select({ ofxFitId: transactions.ofxFitId })
		.from(transactions)
		.where(
			and(eq(transactions.userId, userId), inArray(transactions.ofxFitId, ids)),
		);

	return rows.map((r) => r.ofxFitId).filter((id): id is string => id !== null);
}

export async function importTransactionsAction(
	input: ImportInput,
): Promise<ImportResult> {
	const userId = await getUserId();
	const parsed = importSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
		};
	}

	const { rows, payerId, accountId, cardId, paymentMethod, invoicePeriod } =
		parsed.data;

	// Valida ownership
	const [payerOk, accountOk, cardOk] = await Promise.all([
		validatePagadorOwnership(userId, payerId),
		validateContaOwnership(userId, accountId),
		validateCartaoOwnership(userId, cardId),
	]);

	if (!payerOk) return { success: false, error: "Pessoa não encontrada." };
	if (!accountOk) return { success: false, error: "Conta não encontrada." };
	if (!cardOk) return { success: false, error: "Cartão não encontrado." };

	if (rows.length === 0) {
		return { success: true, imported: 0, skipped: 0, importBatchId: "" };
	}

	const importBatchId = crypto.randomUUID();

	// Cartão de crédito: fatura pode ainda não ter sido paga
	const isSettled = paymentMethod !== "Cartão de crédito";

	const records = rows.map((row) => {
		const purchaseDate = parseLocalDateString(row.date);
		const period =
			invoicePeriod ??
			`${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, "0")}`;

		return {
			name: row.description,
			transactionType: row.transactionType === "income" ? "Receita" : "Despesa",
			condition: "À vista" as const,
			paymentMethod,
			amount: (row.transactionType === "expense"
				? -row.amount
				: row.amount
			).toFixed(2),
			purchaseDate,
			period,
			isSettled,
			userId,
			payerId: payerId ?? null,
			accountId: accountId ?? null,
			cardId: cardId ?? null,
			categoryId: row.categoryId ?? null,
			ofxFitId: row.externalId,
			importBatchId,
		};
	});

	// onConflictDoNothing usa o uniqueIndex (userId, ofxFitId) WHERE ofxFitId IS NOT NULL
	// eliminando o SELECT prévio de checkDuplicateFitIds
	const inserted = await db
		.insert(transactions)
		.values(records)
		.onConflictDoNothing()
		.returning({ id: transactions.id });

	await revalidateForEntity("transactions", userId);

	return {
		success: true,
		imported: inserted.length,
		skipped: records.length - inserted.length,
		importBatchId,
	};
}

export async function deleteTransactionByFitId(
	fitId: string,
): Promise<{ success: boolean; error?: string }> {
	if (!fitId) return { success: false, error: "FITID inválido." };

	const userId = await getUserId();

	await db
		.delete(transactions)
		.where(
			and(eq(transactions.userId, userId), eq(transactions.ofxFitId, fitId)),
		);

	await revalidateForEntity("transactions", userId);

	return { success: true };
}

export async function undoImportAction(
	importBatchId: string,
): Promise<{ success: boolean; error?: string }> {
	if (!importBatchId) return { success: false, error: "Batch inválido." };

	const userId = await getUserId();

	await db
		.delete(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.importBatchId, importBatchId),
			),
		);

	await revalidateForEntity("transactions", userId);

	return { success: true };
}
