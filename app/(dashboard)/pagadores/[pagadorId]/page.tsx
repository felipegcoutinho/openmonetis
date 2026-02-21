import {
	RiBankCard2Line,
	RiBarcodeLine,
	RiWallet3Line,
} from "@remixicon/react";
import { notFound } from "next/navigation";
import { fetchUserPreferences } from "@/app/(dashboard)/ajustes/data";
import { getRecentEstablishmentsAction } from "@/app/(dashboard)/lancamentos/actions";
import { LancamentosPage as LancamentosSection } from "@/components/lancamentos/page/lancamentos-page";
import type {
	ContaCartaoFilterOption,
	LancamentoFilterOption,
	LancamentoItem,
	SelectOption,
} from "@/components/lancamentos/types";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { PagadorCardUsageCard } from "@/components/pagadores/details/pagador-card-usage-card";
import { PagadorHistoryCard } from "@/components/pagadores/details/pagador-history-card";
import { PagadorInfoCard } from "@/components/pagadores/details/pagador-info-card";
import { PagadorLeaveShareCard } from "@/components/pagadores/details/pagador-leave-share-card";
import { PagadorMonthlySummaryCard } from "@/components/pagadores/details/pagador-monthly-summary-card";
import {
	PagadorBoletoCard,
	PagadorPaymentStatusCard,
} from "@/components/pagadores/details/pagador-payment-method-cards";
import { PagadorSharingCard } from "@/components/pagadores/details/pagador-sharing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WidgetCard from "@/components/widget-card";
import type { pagadores } from "@/db/schema";
import { getUserId } from "@/lib/auth/server";
import {
	buildLancamentoWhere,
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	extractLancamentoSearchFilters,
	fetchLancamentoFilterSources,
	getSingleParam,
	type LancamentoSearchFilters,
	mapLancamentosData,
	type ResolvedSearchParams,
	type SluggedFilters,
	type SlugMaps,
} from "@/lib/lancamentos/page-helpers";
import { getPagadorAccess } from "@/lib/pagadores/access";
import {
	fetchPagadorBoletoItems,
	fetchPagadorBoletoStats,
	fetchPagadorCardUsage,
	fetchPagadorHistory,
	fetchPagadorMonthlyBreakdown,
	fetchPagadorPaymentStatus,
} from "@/lib/pagadores/details";
import { parsePeriodParam } from "@/lib/utils/period";
import {
	fetchCurrentUserShare,
	fetchPagadorLancamentos,
	fetchPagadorShares,
} from "./data";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ pagadorId: string }>;
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
	const { pagadorId } = await params;
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
		getRecentEstablishmentsAction(),
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
		cardUsage: cardUsage.slice(0, 3).map((item) => ({
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

				<TabsContent value="profile" className="space-y-4">
					<section>
						<PagadorInfoCard
							pagador={pagadorData}
							selectedPeriod={selectedPeriod}
							summary={summaryPreview}
						/>
					</section>
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
						<WidgetCard
							title="Minhas Faturas"
							subtitle="Valores por cartão neste período"
							icon={<RiBankCard2Line className="size-4" />}
						>
							<PagadorCardUsageCard items={cardUsage} />
						</WidgetCard>
						<WidgetCard
							title="Boletos"
							subtitle="Boletos registrados neste período"
							icon={<RiBarcodeLine className="size-4" />}
						>
							<PagadorBoletoCard items={boletoItems} />
						</WidgetCard>
						<WidgetCard
							title="Status de Pagamento"
							subtitle="Situação das despesas no período"
							icon={<RiWallet3Line className="size-4" />}
						>
							<PagadorPaymentStatusCard data={paymentStatus} />
						</WidgetCard>
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

const normalizeOptionLabel = (
	value: string | null | undefined,
	fallback: string,
) => (value?.trim().length ? value.trim() : fallback);

function buildReadOnlyOptionSets(
	items: LancamentoItem[],
	pagador: typeof pagadores.$inferSelect,
): OptionSet {
	const pagadorLabel = normalizeOptionLabel(pagador.name, "Pagador");
	const pagadorOptions: SelectOption[] = [
		{
			value: pagador.id,
			label: pagadorLabel,
			slug: pagador.id,
		},
	];

	const contaOptionsMap = new Map<string, SelectOption>();
	const cartaoOptionsMap = new Map<string, SelectOption>();
	const categoriaOptionsMap = new Map<string, SelectOption>();

	items.forEach((item) => {
		if (item.contaId && !contaOptionsMap.has(item.contaId)) {
			contaOptionsMap.set(item.contaId, {
				value: item.contaId,
				label: normalizeOptionLabel(item.contaName, "Conta sem nome"),
				slug: item.contaId,
			});
		}
		if (item.cartaoId && !cartaoOptionsMap.has(item.cartaoId)) {
			cartaoOptionsMap.set(item.cartaoId, {
				value: item.cartaoId,
				label: normalizeOptionLabel(item.cartaoName, "Cartão sem nome"),
				slug: item.cartaoId,
			});
		}
		if (item.categoriaId && !categoriaOptionsMap.has(item.categoriaId)) {
			categoriaOptionsMap.set(item.categoriaId, {
				value: item.categoriaId,
				label: normalizeOptionLabel(item.categoriaName, "Categoria"),
				slug: item.categoriaId,
			});
		}
	});

	const contaOptions = Array.from(contaOptionsMap.values());
	const cartaoOptions = Array.from(cartaoOptionsMap.values());
	const categoriaOptions = Array.from(categoriaOptionsMap.values());

	const pagadorFilterOptions: LancamentoFilterOption[] = [
		{ slug: pagador.id, label: pagadorLabel },
	];

	const categoriaFilterOptions: LancamentoFilterOption[] = categoriaOptions.map(
		(option) => ({
			slug: option.value,
			label: option.label,
		}),
	);

	const contaCartaoFilterOptions: ContaCartaoFilterOption[] = [
		...contaOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "conta" as const,
		})),
		...cartaoOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "cartao" as const,
		})),
	];

	return {
		pagadorOptions,
		splitPagadorOptions: [],
		defaultPagadorId: pagador.id,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
		pagadorFilterOptions,
		categoriaFilterOptions,
		contaCartaoFilterOptions,
	};
}
