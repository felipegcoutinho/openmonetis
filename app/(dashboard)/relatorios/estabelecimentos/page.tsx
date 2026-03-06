import { EstablishmentsList } from "@/components/relatorios/estabelecimentos/establishments-list";
import { HighlightsCards } from "@/components/relatorios/estabelecimentos/highlights-cards";
import { PeriodFilterButtons } from "@/components/relatorios/estabelecimentos/period-filter";
import { SummaryCards } from "@/components/relatorios/estabelecimentos/summary-cards";
import { TopCategories } from "@/components/relatorios/estabelecimentos/top-categories";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth/server";
import {
	fetchTopEstabelecimentosData,
	type PeriodFilter,
} from "@/lib/relatorios/estabelecimentos/fetch-data";
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
			<Card className="flex-row items-center justify-between p-3">
				<span className="text-sm text-muted-foreground">
					Selecione o intervalo de meses
				</span>
				<PeriodFilterButtons currentFilter={periodFilter} />
			</Card>

			<SummaryCards summary={data.summary} />

			<HighlightsCards summary={data.summary} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
