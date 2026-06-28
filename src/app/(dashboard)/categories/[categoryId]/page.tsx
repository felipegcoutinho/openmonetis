import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CategoryDetailHeader } from "@/features/categories/components/category-detail-header";
import { fetchCategoryDetails } from "@/features/dashboard/categories/category-details-queries";
import { fetchUserPreferences } from "@/features/settings/queries";
import { TransactionsPage } from "@/features/transactions/components/page/transactions-page";
import {
	buildOptionSets,
	buildSluggedFilters,
} from "@/features/transactions/lib/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUserId } from "@/shared/lib/auth/server";
import { displayPeriod, parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	params: Promise<{ categoryId: string }>;
	searchParams?: PageSearchParams;
};

const getSingleParam = (
	params: Record<string, string | string[] | undefined> | undefined,
	key: string,
) => {
	const value = params?.[key];
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function Page({ params, searchParams }: PageProps) {
	await connection();
	const { categoryId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const [filterSources, estabelecimentos, userPreferences] = await Promise.all([
		fetchTransactionFilterSources(userId),
		fetchRecentEstablishments(userId),
		fetchUserPreferences(userId),
	]);
	const detail = await fetchCategoryDetails(
		userId,
		categoryId,
		selectedPeriod,
		userPreferences?.hideAnticipatedInstallments ?? false,
	);

	if (!detail) {
		notFound();
	}

	const sluggedFilters = buildSluggedFilters(filterSources);
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

	const currentPeriodLabel = displayPeriod(detail.period);
	const previousPeriodLabel = displayPeriod(detail.previousPeriod);

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />
			<CategoryDetailHeader
				category={detail.category}
				currentPeriodLabel={currentPeriodLabel}
				previousPeriodLabel={previousPeriodLabel}
				currentTotal={detail.currentTotal}
				previousTotal={detail.previousTotal}
				percentageChange={detail.percentageChange}
				transactionCount={detail.transactions.length}
			/>
			<TransactionsPage
				currentUserId={userId}
				transactions={detail.transactions}
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				payerFilterOptions={payerFilterOptions}
				categoryFilterOptions={categoryFilterOptions}
				accountCardFilterOptions={accountCardFilterOptions}
				selectedPeriod={detail.period}
				estabelecimentos={estabelecimentos}
				allowCreate={true}
				noteAsColumn={userPreferences?.statementNoteAsColumn ?? false}
				columnOrder={userPreferences?.transactionsColumnOrder ?? null}
				groupTransactionsByDate={
					userPreferences?.groupTransactionsByDate ?? true
				}
				attachmentMaxSizeMb={userPreferences?.attachmentMaxSizeMb ?? 50}
			/>
		</main>
	);
}
