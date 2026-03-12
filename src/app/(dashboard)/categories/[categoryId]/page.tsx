import { notFound } from "next/navigation";
import { CategoryDetailHeader } from "@/features/categories/components/category-detail-header";
import { fetchCategoryDetails } from "@/features/dashboard/categories/category-details-queries";
import { fetchUserPreferences } from "@/features/settings/queries";
import { LancamentosPage } from "@/features/transactions/components/page/transactions-page";
import {
	buildOptionSets,
	buildSluggedFilters,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchRecentEstablishments,
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
	const { categoryId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const [detail, filterSources, estabelecimentos, userPreferences] =
		await Promise.all([
			fetchCategoryDetails(userId, categoryId, selectedPeriod),
			fetchLancamentoFilterSources(userId),
			fetchRecentEstablishments(userId),
			fetchUserPreferences(userId),
		]);

	if (!detail) {
		notFound();
	}

	const sluggedFilters = buildSluggedFilters(filterSources);
	const {
		pagadorOptions,
		splitPagadorOptions,
		defaultPagadorId,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
		pagadorFilterOptions,
		categoriaFilterOptions,
		contaCartaoFilterOptions,
	} = buildOptionSets({
		...sluggedFilters,
		pagadorRows: filterSources.pagadorRows,
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
			<LancamentosPage
				currentUserId={userId}
				lancamentos={detail.transactions}
				pagadorOptions={pagadorOptions}
				splitPagadorOptions={splitPagadorOptions}
				defaultPagadorId={defaultPagadorId}
				contaOptions={contaOptions}
				cartaoOptions={cartaoOptions}
				categoriaOptions={categoriaOptions}
				pagadorFilterOptions={pagadorFilterOptions}
				categoriaFilterOptions={categoriaFilterOptions}
				contaCartaoFilterOptions={contaCartaoFilterOptions}
				selectedPeriod={detail.period}
				estabelecimentos={estabelecimentos}
				allowCreate={true}
				noteAsColumn={userPreferences?.extratoNoteAsColumn ?? false}
				columnOrder={userPreferences?.lancamentosColumnOrder ?? null}
			/>
		</main>
	);
}
