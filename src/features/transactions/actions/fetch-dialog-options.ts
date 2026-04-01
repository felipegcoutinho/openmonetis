"use server";

import {
	buildOptionSets,
	buildSluggedFilters,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import { getUserId } from "@/shared/lib/auth/server";
import type { SelectOption } from "../components/types";

export type TransactionDialogOptions = {
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	estabelecimentos: string[];
};

export async function fetchTransactionDialogOptionsAction(): Promise<TransactionDialogOptions> {
	const userId = await getUserId();

	const [filterSources, estabelecimentos] = await Promise.all([
		fetchTransactionFilterSources(userId),
		fetchRecentEstablishments(userId),
	]);

	const sluggedFilters = buildSluggedFilters(filterSources);

	const {
		payerOptions,
		splitPayerOptions,
		defaultPayerId,
		accountOptions,
		cardOptions,
		categoryOptions,
	} = buildOptionSets({
		...sluggedFilters,
		payerRows: filterSources.payerRows,
	});

	return {
		payerOptions,
		splitPayerOptions,
		defaultPayerId,
		accountOptions,
		cardOptions,
		categoryOptions,
		estabelecimentos,
	};
}
