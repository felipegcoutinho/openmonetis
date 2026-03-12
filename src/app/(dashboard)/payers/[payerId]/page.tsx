import {
	RiBankCard2Line,
	RiBarcodeLine,
	RiWallet3Line,
} from "@remixicon/react";
import { notFound } from "next/navigation";
import { PagadorCardUsageCard } from "@/features/payers/components/details/payer-card-usage-card";
import { PagadorHeaderCard } from "@/features/payers/components/details/payer-header-card";
import { PagadorHistoryCard } from "@/features/payers/components/details/payer-history-card";
import { PagadorInfoCard } from "@/features/payers/components/details/payer-info-card";
import { PagadorLeaveShareCard } from "@/features/payers/components/details/payer-leave-share-card";
import { PagadorMonthlySummaryCard } from "@/features/payers/components/details/payer-monthly-summary-card";
import {
	PagadorBoletoCard,
	PagadorPaymentStatusCard,
} from "@/features/payers/components/details/payer-payment-method-cards";
import { PagadorSharingCard } from "@/features/payers/components/details/payer-sharing-card";
import {
	fetchCurrentUserShare,
	fetchPagadorLancamentos,
	fetchPagadorShares,
} from "@/features/payers/detail-queries";
import { buildReadOnlyOptionSets } from "@/features/payers/lib/build-readonly-option-sets";
import { fetchUserPreferences } from "@/features/settings/queries";
import { LancamentosPage as LancamentosSection } from "@/features/transactions/components/page/transactions-page";
import {
	buildLancamentoWhere,
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	extractLancamentoSearchFilters,
	getSingleParam,
	type LancamentoSearchFilters,
	mapLancamentosData,
	type ResolvedSearchParams,
	type SluggedFilters,
	type SlugMaps,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchRecentEstablishments,
} from "@/features/transactions/queries";
import { ExpandableWidgetCard } from "@/shared/components/expandable-widget-card";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { getUserId } from "@/shared/lib/auth/server";
import { getPagadorAccess } from "@/shared/lib/payers/access";
import {
	fetchPagadorBoletoItems,
	fetchPagadorBoletoStats,
	fetchPagadorCardUsage,
	fetchPagadorHistory,
	fetchPagadorMonthlyBreakdown,
	fetchPagadorPaymentStatus,
	type PagadorCardUsageItem,
} from "@/shared/lib/payers/details";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ payerId: string }>;
	searchParams?: PageSearchParams;
};

const capitalize = (value: string) =>
	value.length ? value.charAt(0).toUpperCase().concat(value.slice(1)) : value;

const EMPTY_FILTERS: LancamentoSearchFilters = {
	transactionFilter: null,
	conditionFilter: null,
	paymentFilter: null,
	pagadorFilter: null,
	categoriaFilter: null,
	contaCartaoFilter: null,
	searchFilter: null,
};

const createEmptySlugMaps = (): SlugMaps => ({
	pagador: new Map(),
	categoria: new Map(),
	conta: new Map(),
	cartao: new Map(),
});

type OptionSet = ReturnType<typeof buildOptionSets>;

export default async function Page({ params, searchParams }: PageProps) {
	const { payerId: pagadorId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const access = await getPagadorAccess(userId, pagadorId);

	if (!access) {
		notFound();
	}

	const { pagador, canEdit } = access;
	const dataOwnerId = pagador.userId;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const {
		period: selectedPeriod,
		monthName,
		year,
	} = parsePeriodParam(periodoParamRaw);
	const periodLabel = `${capitalize(monthName)} de ${year}`;

	const allSearchFilters = extractLancamentoSearchFilters(resolvedSearchParams);
	const searchFilters = canEdit
		? allSearchFilters
		: {
				...EMPTY_FILTERS,
				searchFilter: allSearchFilters.searchFilter, // Permitir busca mesmo em modo read-only
			};

	let filterSources: Awaited<
		ReturnType<typeof fetchLancamentoFilterSources>
	> | null = null;
	let loggedUserFilterSources: Awaited<
		ReturnType<typeof fetchLancamentoFilterSources>
	> | null = null;
	let sluggedFilters: SluggedFilters;
	let slugMaps: SlugMaps;

	if (canEdit) {
		filterSources = await fetchLancamentoFilterSources(dataOwnerId);
		sluggedFilters = buildSluggedFilters(filterSources);
		slugMaps = buildSlugMaps(sluggedFilters);
	} else {
		// Buscar opções do usuário logado para usar ao importar
		loggedUserFilterSources = await fetchLancamentoFilterSources(userId);
		sluggedFilters = {
			pagadorFiltersRaw: [],
			categoriaFiltersRaw: [],
			contaFiltersRaw: [],
			cartaoFiltersRaw: [],
		};
		slugMaps = createEmptySlugMaps();
	}

	const filters = buildLancamentoWhere({
		userId: dataOwnerId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
		pagadorId: pagador.id,
	});

	const sharesPromise = canEdit
		? fetchPagadorShares(pagador.id)
		: Promise.resolve([]);

	const currentUserSharePromise = !canEdit
		? fetchCurrentUserShare(pagador.id, userId)
		: Promise.resolve(null);

	const [
		lancamentoRows,
		monthlyBreakdown,
		historyData,
		cardUsage,
		boletoStats,
		boletoItems,
		paymentStatus,
		shareRows,
		currentUserShare,
		estabelecimentos,
		userPreferences,
	] = await Promise.all([
		fetchPagadorLancamentos(filters),
		fetchPagadorMonthlyBreakdown({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorHistory({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorCardUsage({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorBoletoStats({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorBoletoItems({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorPaymentStatus({
			userId: dataOwnerId,
			pagadorId: pagador.id,
			period: selectedPeriod,
		}),
		sharesPromise,
		currentUserSharePromise,
		fetchRecentEstablishments(userId),
		fetchUserPreferences(userId),
	]);

	const mappedLancamentos = mapLancamentosData(lancamentoRows);
	const lancamentosData = canEdit
		? mappedLancamentos
		: mappedLancamentos.map((item) => ({ ...item, readonly: true }));

	const pagadorSharesData = shareRows;

	let optionSets: OptionSet;
	let loggedUserOptionSets: OptionSet | null = null;
	let effectiveSluggedFilters = sluggedFilters;

	if (canEdit && filterSources) {
		optionSets = buildOptionSets({
			...sluggedFilters,
			pagadorRows: filterSources.pagadorRows,
		});
	} else {
		effectiveSluggedFilters = {
			pagadorFiltersRaw: [
				{
					id: pagador.id,
					label: pagador.name,
					slug: pagador.id,
					role: pagador.role,
					avatarUrl: pagador.avatarUrl,
				},
			],
			categoriaFiltersRaw: [],
			contaFiltersRaw: [],
			cartaoFiltersRaw: [],
		};
		optionSets = buildReadOnlyOptionSets(lancamentosData, pagador);

		// Construir opções do usuário logado para usar ao importar
		if (loggedUserFilterSources) {
			const loggedUserSluggedFilters = buildSluggedFilters(
				loggedUserFilterSources,
			);
			loggedUserOptionSets = buildOptionSets({
				...loggedUserSluggedFilters,
				pagadorRows: loggedUserFilterSources.pagadorRows,
			});
		}
	}

	const pagadorSlug =
		effectiveSluggedFilters.pagadorFiltersRaw.find(
			(item) => item.id === pagador.id,
		)?.slug ?? null;

	const pagadorFilterOptions = pagadorSlug
		? optionSets.pagadorFilterOptions.filter(
				(option) => option.slug === pagadorSlug,
			)
		: optionSets.pagadorFilterOptions;

	const pagadorData = {
		id: pagador.id,
		name: pagador.name,
		email: pagador.email ?? null,
		avatarUrl: pagador.avatarUrl ?? null,
		status: pagador.status,
		note: pagador.note ?? null,
		role: pagador.role ?? null,
		isAutoSend: pagador.isAutoSend ?? false,
		createdAt: pagador.createdAt
			? pagador.createdAt.toISOString()
			: new Date().toISOString(),
		lastMailAt: pagador.lastMailAt ? pagador.lastMailAt.toISOString() : null,
		shareCode: canEdit ? pagador.shareCode : null,
		canEdit,
	};

	const summaryPreview = {
		periodLabel,
		totalExpenses: monthlyBreakdown.totalExpenses,
		paymentSplits: monthlyBreakdown.paymentSplits,
		cardUsage: cardUsage.slice(0, 3).map((item: PagadorCardUsageItem) => ({
			name: item.name,
			amount: item.amount,
		})),
		boletoStats: {
			totalAmount: boletoStats.totalAmount,
			paidAmount: boletoStats.paidAmount,
			pendingAmount: boletoStats.pendingAmount,
			paidCount: boletoStats.paidCount,
			pendingCount: boletoStats.pendingCount,
		},
		lancamentoCount: lancamentosData.length,
	};

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />

			<Tabs defaultValue="profile" className="w-full">
				<TabsList className="mb-2">
					<TabsTrigger value="profile">Perfil</TabsTrigger>
					<TabsTrigger value="painel">Painel</TabsTrigger>
					<TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
				</TabsList>
				<PagadorHeaderCard
					pagador={pagadorData}
					selectedPeriod={selectedPeriod}
					summary={summaryPreview}
				/>

				<TabsContent value="profile" className="space-y-4">
					<PagadorInfoCard pagador={pagadorData} />
					{canEdit && pagadorData.shareCode ? (
						<PagadorSharingCard
							pagadorId={pagador.id}
							shareCode={pagadorData.shareCode}
							shares={pagadorSharesData}
						/>
					) : null}
					{!canEdit && currentUserShare ? (
						<PagadorLeaveShareCard
							shareId={currentUserShare.id}
							pagadorName={pagadorData.name}
							createdAt={currentUserShare.createdAt}
						/>
					) : null}
				</TabsContent>

				<TabsContent value="painel" className="space-y-4">
					<section className="grid gap-3 lg:grid-cols-2">
						<PagadorMonthlySummaryCard
							periodLabel={periodLabel}
							breakdown={monthlyBreakdown}
						/>
						<PagadorHistoryCard data={historyData} />
					</section>

					<section className="grid gap-3 lg:grid-cols-3">
						<ExpandableWidgetCard
							title="Minhas Faturas"
							subtitle="Valores por cartão neste período"
							icon={<RiBankCard2Line className="size-4" />}
						>
							<PagadorCardUsageCard items={cardUsage} />
						</ExpandableWidgetCard>
						<ExpandableWidgetCard
							title="Boletos"
							subtitle="Boletos registrados neste período"
							icon={<RiBarcodeLine className="size-4" />}
						>
							<PagadorBoletoCard items={boletoItems} />
						</ExpandableWidgetCard>
						<ExpandableWidgetCard
							title="Status de Pagamento"
							subtitle="Situação das despesas no período"
							icon={<RiWallet3Line className="size-4" />}
						>
							<PagadorPaymentStatusCard data={paymentStatus} />
						</ExpandableWidgetCard>
					</section>
				</TabsContent>

				<TabsContent value="lancamentos">
					<section className="flex flex-col gap-4">
						<LancamentosSection
							currentUserId={userId}
							lancamentos={lancamentosData}
							pagadorOptions={optionSets.pagadorOptions}
							splitPagadorOptions={optionSets.splitPagadorOptions}
							defaultPagadorId={pagador.id}
							contaOptions={optionSets.contaOptions}
							cartaoOptions={optionSets.cartaoOptions}
							categoriaOptions={optionSets.categoriaOptions}
							pagadorFilterOptions={pagadorFilterOptions}
							categoriaFilterOptions={optionSets.categoriaFilterOptions}
							contaCartaoFilterOptions={optionSets.contaCartaoFilterOptions}
							selectedPeriod={selectedPeriod}
							estabelecimentos={estabelecimentos}
							allowCreate={canEdit}
							noteAsColumn={userPreferences?.extratoNoteAsColumn ?? false}
							columnOrder={userPreferences?.lancamentosColumnOrder ?? null}
							importPagadorOptions={loggedUserOptionSets?.pagadorOptions}
							importSplitPagadorOptions={
								loggedUserOptionSets?.splitPagadorOptions
							}
							importDefaultPagadorId={loggedUserOptionSets?.defaultPagadorId}
							importContaOptions={loggedUserOptionSets?.contaOptions}
							importCartaoOptions={loggedUserOptionSets?.cartaoOptions}
							importCategoriaOptions={loggedUserOptionSets?.categoriaOptions}
						/>
					</section>
				</TabsContent>
			</Tabs>
		</main>
	);
}
