import { DashboardGridEditable } from "@/components/dashboard/dashboard-grid-editable";
import { DashboardMetricsCards } from "@/components/dashboard/dashboard-metrics-cards";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { getUser } from "@/lib/auth/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import {
	buildOptionSets,
	buildSluggedFilters,
	fetchLancamentoFilterSources,
} from "@/lib/lancamentos/page-helpers";
import { parsePeriodParam } from "@/lib/utils/period";
import { getRecentEstablishmentsAction } from "../lancamentos/actions";
import { fetchUserDashboardPreferences } from "./data";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
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

export default async function Page({ searchParams }: PageProps) {
	const user = await getUser();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const [dashboardData, preferences, filterSources, estabelecimentos] =
		await Promise.all([
			fetchDashboardData(user.id, selectedPeriod),
			fetchUserDashboardPreferences(user.id),
			fetchLancamentoFilterSources(user.id),
			getRecentEstablishmentsAction(),
		]);
	const { dashboardWidgets } = preferences;
	const sluggedFilters = buildSluggedFilters(filterSources);
	const {
		pagadorOptions,
		splitPagadorOptions,
		defaultPagadorId,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
	} = buildOptionSets({
		...sluggedFilters,
		pagadorRows: filterSources.pagadorRows,
	});

	return (
		<main className="flex flex-col gap-4">
			<DashboardWelcome name={user.name} />
			<MonthNavigation />
			<DashboardMetricsCards metrics={dashboardData.metrics} />
			<DashboardGridEditable
				data={dashboardData}
				period={selectedPeriod}
				initialPreferences={dashboardWidgets}
				quickActionOptions={{
					pagadorOptions,
					splitPagadorOptions,
					defaultPagadorId,
					contaOptions,
					cartaoOptions,
					categoriaOptions,
					estabelecimentos,
				}}
			/>
		</main>
	);
}
