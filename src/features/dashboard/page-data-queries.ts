import { unstable_cache } from "next/cache";
import { fetchDashboardData } from "@/features/dashboard/fetch-dashboard-data";
import { fetchUserDashboardPreferences } from "@/features/dashboard/preferences-queries";
import {
	buildOptionSets,
	buildSluggedFilters,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";

export type DashboardQuickActionOptions = {
	payerOptions: ReturnType<typeof buildOptionSets>["payerOptions"];
	splitPayerOptions: ReturnType<typeof buildOptionSets>["splitPayerOptions"];
	defaultPayerId: string | null;
	accountOptions: ReturnType<typeof buildOptionSets>["accountOptions"];
	cardOptions: ReturnType<typeof buildOptionSets>["cardOptions"];
	categoryOptions: ReturnType<typeof buildOptionSets>["categoryOptions"];
	estabelecimentos: string[];
};

async function fetchDashboardQuickActionOptionsInternal(
	userId: string,
): Promise<DashboardQuickActionOptions> {
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

export function fetchDashboardQuickActionOptions(userId: string) {
	return unstable_cache(
		() => fetchDashboardQuickActionOptionsInternal(userId),
		[`dashboard-quick-actions-${userId}`],
		{
			tags: [`dashboard-${userId}`],
			revalidate: 60,
		},
	)();
}

export async function fetchDashboardPageData(userId: string, period: string) {
	const [dashboardData, preferences, quickActionOptions] = await Promise.all([
		fetchDashboardData(userId, period),
		fetchUserDashboardPreferences(userId),
		fetchDashboardQuickActionOptions(userId),
	]);

	return {
		dashboardData,
		preferences,
		quickActionOptions,
	};
}
