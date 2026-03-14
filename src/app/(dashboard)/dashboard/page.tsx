import { DashboardGridEditable } from "@/features/dashboard/components/dashboard-grid-editable";
import { DashboardMetricsCards } from "@/features/dashboard/components/dashboard-metrics-cards";
import { DashboardWelcome } from "@/features/dashboard/components/dashboard-welcome";
import { fetchDashboardData } from "@/features/dashboard/fetch-dashboard-data";
import { fetchUserDashboardPreferences } from "@/features/dashboard/preferences-queries";
import {
	buildOptionSets,
	buildSluggedFilters,
	getSingleParam,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
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
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const [dashboardData, preferences, filterSources, estabelecimentos] =
		await Promise.all([
			fetchDashboardData(user.id, selectedPeriod),
			fetchUserDashboardPreferences(user.id),
			fetchTransactionFilterSources(user.id),
			fetchRecentEstablishments(user.id),
		]);
	const { dashboardWidgets } = preferences;
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
					payerOptions,
					splitPayerOptions,
					defaultPayerId,
					accountOptions,
					cardOptions,
					categoryOptions,
					estabelecimentos,
				}}
			/>
		</main>
	);
}
