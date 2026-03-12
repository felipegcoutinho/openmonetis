import { triggerRecurringGeneration } from "@/features/recurring/trigger-recurring-generation";
import { fetchUserPreferences } from "@/features/settings/queries";
import { LancamentosPage } from "@/features/transactions/components/page/transactions-page";
import {
	buildLancamentoWhere,
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	extractLancamentoSearchFilters,
	getSingleParam,
	mapLancamentosData,
	type ResolvedSearchParams,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchLancamentos,
	fetchRecentEstablishments,
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
	await triggerRecurringGeneration(userId);
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractLancamentoSearchFilters(resolvedSearchParams);

	const [filterSources, userPreferences] = await Promise.all([
		fetchLancamentoFilterSources(userId),
		fetchUserPreferences(userId),
	]);

	const sluggedFilters = buildSluggedFilters(filterSources);
	const slugMaps = buildSlugMaps(sluggedFilters);

	const filters = buildLancamentoWhere({
		userId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
	});

	const [lancamentoRows, estabelecimentos] = await Promise.all([
		fetchLancamentos(filters),
		fetchRecentEstablishments(userId),
	]);
	const lancamentosData = mapLancamentosData(lancamentoRows);

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

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />
			<LancamentosPage
				currentUserId={userId}
				lancamentos={lancamentosData}
				pagadorOptions={pagadorOptions}
				splitPagadorOptions={splitPagadorOptions}
				defaultPagadorId={defaultPagadorId}
				contaOptions={contaOptions}
				cartaoOptions={cartaoOptions}
				categoriaOptions={categoriaOptions}
				pagadorFilterOptions={pagadorFilterOptions}
				categoriaFilterOptions={categoriaFilterOptions}
				contaCartaoFilterOptions={contaCartaoFilterOptions}
				selectedPeriod={selectedPeriod}
				estabelecimentos={estabelecimentos}
				noteAsColumn={userPreferences?.extratoNoteAsColumn ?? false}
				columnOrder={userPreferences?.lancamentosColumnOrder ?? null}
			/>
		</main>
	);
}
