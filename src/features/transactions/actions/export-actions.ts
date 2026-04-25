"use server";

import { z } from "zod";
import { fetchAccountLancamentos } from "@/features/accounts/statement-queries";
import type { TransactionsExportContext } from "@/features/transactions/export-types";
import {
	buildSluggedFilters,
	buildSlugMaps,
	buildTransactionWhere,
	mapTransactionsData,
} from "@/features/transactions/page-helpers";
import {
	fetchTransactionFilterSources,
	fetchTransactions,
} from "@/features/transactions/queries";
import {
	type ActionResult,
	handleActionError,
} from "@/shared/lib/actions/helpers";
import { getUserId } from "@/shared/lib/auth/server";

const exportTransactionsSchema: z.ZodType<TransactionsExportContext> = z.object(
	{
		source: z.enum(["transactions", "account-statement"]),
		period: z.string().regex(/^\d{4}-\d{2}$/),
		filters: z.object({
			transactionFilter: z.string().nullable(),
			conditionFilter: z.string().nullable(),
			paymentFilter: z.string().nullable(),
			payerFilter: z.string().nullable(),
			categoryFilter: z.string().nullable(),
			accountCardFilter: z.string().nullable(),
			searchFilter: z.string().nullable(),
			settledFilter: z.string().nullable(),
			attachmentFilter: z.string().nullable(),
			dividedFilter: z.string().nullable(),
		}),
		accountId: z.string().min(1).nullable().optional(),
		cardId: z.string().min(1).nullable().optional(),
		payerId: z.string().min(1).nullable().optional(),
		settledOnly: z.boolean().optional(),
	},
);

export async function exportTransactionsDataAction(
	input: TransactionsExportContext,
): Promise<
	ActionResult<{ transactions: ReturnType<typeof mapTransactionsData> }>
> {
	try {
		const userId = await getUserId();
		const validated = exportTransactionsSchema.parse(input);
		const filterSources = await fetchTransactionFilterSources(userId);
		const sluggedFilters = buildSluggedFilters(filterSources);
		const slugMaps = buildSlugMaps(sluggedFilters);

		const filters = buildTransactionWhere({
			userId,
			period: validated.period,
			filters: validated.filters,
			slugMaps,
			accountId: validated.accountId ?? undefined,
			cardId: validated.cardId ?? undefined,
			payerId: validated.payerId ?? undefined,
		});

		const rows =
			validated.source === "account-statement"
				? await fetchAccountLancamentos(filters, validated.settledOnly ?? true)
				: await fetchTransactions(filters);

		return {
			success: true,
			message: "Dados carregados para exportação.",
			data: {
				transactions: mapTransactionsData(rows),
			},
		};
	} catch (error) {
		return handleActionError(error) as ActionResult<{
			transactions: ReturnType<typeof mapTransactionsData>;
		}>;
	}
}
