import { DashboardGridEditable } from "@/features/dashboard/components/dashboard-grid-editable";
import { DashboardMetricsCards } from "@/features/dashboard/components/dashboard-metrics-cards";
import { DashboardWelcome } from "@/features/dashboard/components/dashboard-welcome";
import { fetchDashboardData } from "@/features/dashboard/fetch-dashboard-data";
import { fetchUserDashboardPreferences } from "@/features/dashboard/preferences-queries";
import { triggerRecurringGeneration } from "@/features/recurring/trigger-recurring-generation";
import {
	buildOptionSets,
	buildSluggedFilters,
	getSingleParam,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchRecentEstablishments,
} from "@/features/transactions/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUser } from "@/shared/lib/auth/server";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
	const user = await getUser();
	await triggerRecurringGeneration(user.id);
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const [dashboardData, preferences, filterSources, estabelecimentos] =
		await Promise.all([
			fetchDashboardData(user.id, selectedPeriod),
			fetchUserDashboardPreferences(user.id),
			fetchLancamentoFilterSources(user.id),
			fetchRecentEstablishments(user.id),
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
