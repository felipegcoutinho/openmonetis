import { connection } from "next/server";
import { DashboardGridEditable } from "@/features/dashboard/components/dashboard-grid-editable";
import { DashboardMetricsCards } from "@/features/dashboard/components/dashboard-metrics-cards";
import { DashboardWelcome } from "@/features/dashboard/components/dashboard-welcome";
import { extractDashboardLogoNames } from "@/features/dashboard/extract-logo-names";
import { fetchDashboardPageData } from "@/features/dashboard/page-data-queries";
import { getSingleParam } from "@/features/transactions/page-helpers";
import { LogoPrefetchProvider } from "@/shared/components/entity-avatar";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUser } from "@/shared/lib/auth/server";
import { prefetchLogoMappings } from "@/shared/lib/logo/prefetch-server";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
	await connection();
	const user = await getUser();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const { dashboardData, preferences, quickActionOptions } =
		await fetchDashboardPageData(user.id, selectedPeriod);
	const { dashboardWidgets } = preferences;

	const logoMappings = await prefetchLogoMappings(
		user.id,
		extractDashboardLogoNames(dashboardData),
	);

	return (
		<main className="flex flex-col gap-4">
			<DashboardWelcome name={user.name} />
			<MonthNavigation />
			<DashboardMetricsCards metrics={dashboardData.metrics} />
			<LogoPrefetchProvider mappings={logoMappings}>
				<DashboardGridEditable
					data={dashboardData}
					period={selectedPeriod}
					initialPreferences={dashboardWidgets}
					quickActionOptions={quickActionOptions}
				/>
			</LogoPrefetchProvider>
		</main>
	);
}
