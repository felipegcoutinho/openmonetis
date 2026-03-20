import { fetchUserPreferences } from "@/features/settings/queries";
import { TransactionsPage } from "@/features/transactions/components/page/transactions-page";
import {
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	buildTransactionWhere,
	extractTransactionSearchFilters,
	getSingleParam,
	mapTransactionsData,
	type ResolvedSearchParams,
	resolveTransactionPagination,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
	fetchTransactionsPage,
} from "@/features/transactions/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUserId } from "@/shared/lib/auth/server";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	searchParams?: PageSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractTransactionSearchFilters(resolvedSearchParams);
	const pagination = resolveTransactionPagination(resolvedSearchParams);

	const [filterSources, userPreferences] = await Promise.all([
		fetchTransactionFilterSources(userId),
		fetchUserPreferences(userId),
	]);

	const sluggedFilters = buildSluggedFilters(filterSources);
	const slugMaps = buildSlugMaps(sluggedFilters);

	const filters = buildTransactionWhere({
		userId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
	});

	const [transactionsPage, estabelecimentos] = await Promise.all([
		fetchTransactionsPage(filters, pagination),
		fetchRecentEstablishments(userId),
	]);
	const transactionData = mapTransactionsData(transactionsPage.rows);

	const {
		payerOptions,
		splitPayerOptions,
		defaultPayerId,
		accountOptions,
		cardOptions,
		categoryOptions,
		payerFilterOptions,
		categoryFilterOptions,
		accountCardFilterOptions,
	} = buildOptionSets({
		...sluggedFilters,
		payerRows: filterSources.payerRows,
	});

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />
			<TransactionsPage
				currentUserId={userId}
				transactions={transactionData}
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				payerFilterOptions={payerFilterOptions}
				categoryFilterOptions={categoryFilterOptions}
				accountCardFilterOptions={accountCardFilterOptions}
				selectedPeriod={selectedPeriod}
				estabelecimentos={estabelecimentos}
				pagination={{
					page: transactionsPage.page,
					pageSize: transactionsPage.pageSize,
					totalItems: transactionsPage.totalItems,
					totalPages: transactionsPage.totalPages,
				}}
				exportContext={{
					source: "transactions",
					period: selectedPeriod,
					filters: searchFilters,
				}}
				noteAsColumn={userPreferences?.statementNoteAsColumn ?? false}
				columnOrder={userPreferences?.transactionsColumnOrder ?? null}
			/>
		</main>
	);
}
