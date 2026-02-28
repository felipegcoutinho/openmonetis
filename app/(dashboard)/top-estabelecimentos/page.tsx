import { EstablishmentsList } from "@/components/top-estabelecimentos/establishments-list";
import { HighlightsCards } from "@/components/top-estabelecimentos/highlights-cards";
import { PeriodFilterButtons } from "@/components/top-estabelecimentos/period-filter";
import { SummaryCards } from "@/components/top-estabelecimentos/summary-cards";
import { TopCategories } from "@/components/top-estabelecimentos/top-categories";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth/server";
import {
	fetchTopEstabelecimentosData,
	type PeriodFilter,
} from "@/lib/top-estabelecimentos/fetch-data";
import { parsePeriodParam } from "@/lib/utils/period";

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

const validatePeriodFilter = (value: string | null): PeriodFilter => {
	if (value === "3" || value === "6" || value === "12") {
		return value;
	}
	return "6";
};

export default async function TopEstabelecimentosPage({
	searchParams,
}: PageProps) {
	const user = await getUser();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const mesesParam = getSingleParam(resolvedSearchParams, "meses");

	const { period: currentPeriod } = parsePeriodParam(periodoParam);
	const periodFilter = validatePeriodFilter(mesesParam);

	const data = await fetchTopEstabelecimentosData(
		user.id,
		currentPeriod,
		periodFilter,
	);

	return (
		<main className="flex flex-col gap-4">
			<Card className="p-3 flex-row justify-between items-center">
				<span className="text-sm text-muted-foreground">
					Selecione o intervalo de meses
				</span>
				<PeriodFilterButtons currentFilter={periodFilter} />
			</Card>

			<SummaryCards summary={data.summary} />

			<HighlightsCards summary={data.summary} />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<EstablishmentsList establishments={data.establishments} />
				</div>
				<div>
					<TopCategories categories={data.topCategories} />
				</div>
			</div>
		</main>
	);
}
