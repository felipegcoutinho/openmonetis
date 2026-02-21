import { fetchUserPreferences } from "@/app/(dashboard)/ajustes/data";
import { LancamentosPage } from "@/components/lancamentos/page/lancamentos-page";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { getUserId } from "@/lib/auth/server";
import {
	buildLancamentoWhere,
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	extractLancamentoSearchFilters,
	fetchLancamentoFilterSources,
	getSingleParam,
	mapLancamentosData,
	type ResolvedSearchParams,
} from "@/lib/lancamentos/page-helpers";
import { parsePeriodParam } from "@/lib/utils/period";
import { getRecentEstablishmentsAction } from "./actions";
import { fetchLancamentos } from "./data";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	searchParams?: PageSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
	const userId = await getUserId();
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

	const lancamentoRows = await fetchLancamentos(filters);
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

	const estabelecimentos = await getRecentEstablishmentsAction();

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
