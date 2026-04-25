import {
	RiBankCard2Line,
	RiBarcodeLine,
	RiWallet3Line,
} from "@remixicon/react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PayerCardUsageCard } from "@/features/payers/components/details/payer-card-usage-card";
import { PayerHeaderCard } from "@/features/payers/components/details/payer-header-card";
import { PayerHistoryCard } from "@/features/payers/components/details/payer-history-card";
import { PagadorInfoCard } from "@/features/payers/components/details/payer-info-card";
import { PayerLeaveShareCard } from "@/features/payers/components/details/payer-leave-share-card";
import { PayerMonthlySummaryCard } from "@/features/payers/components/details/payer-monthly-summary-card";
import {
	PayerBoletoCard,
	PayerPaymentStatusCard,
} from "@/features/payers/components/details/payer-payment-method-cards";
import { PayerSharingCard } from "@/features/payers/components/details/payer-sharing-card";
import {
	fetchCurrentUserShare,
	fetchPagadorLancamentos,
	fetchPayerShares,
} from "@/features/payers/detail-queries";
import { buildReadOnlyOptionSets } from "@/features/payers/lib/build-readonly-option-sets";
import { fetchUserPreferences } from "@/features/settings/queries";
import { TransactionsPage as LancamentosSection } from "@/features/transactions/components/page/transactions-page";
import {
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	buildTransactionWhere,
	extractTransactionSearchFilters,
	getSingleParam,
	mapTransactionsData,
	type ResolvedSearchParams,
	type SluggedFilters,
	type SlugMaps,
	type TransactionSearchFilters,
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import { LogoPrefetchProvider } from "@/shared/components/entity-avatar";
import { ExpandableWidgetCard } from "@/shared/components/expandable-widget-card";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { getUserId } from "@/shared/lib/auth/server";
import { prefetchLogoMappings } from "@/shared/lib/logo/prefetch-server";
import { getPayerAccess } from "@/shared/lib/payers/access";
import {
	fetchPagadorBoletoItems,
	fetchPagadorBoletoStats,
	fetchPagadorCardUsage,
	fetchPagadorPaymentStatus,
	fetchPayerHistory,
	fetchPayerMonthlyBreakdown,
	type PayerCardUsageItem,
} from "@/shared/lib/payers/details";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ payerId: string }>;
	searchParams?: PageSearchParams;
};

const capitalize = (value: string) =>
	value.length ? value.charAt(0).toUpperCase().concat(value.slice(1)) : value;

const EMPTY_FILTERS: TransactionSearchFilters = {
	transactionFilter: null,
	conditionFilter: null,
	paymentFilter: null,
	payerFilter: null,
	categoryFilter: null,
	accountCardFilter: null,
	searchFilter: null,
	settledFilter: null,
	attachmentFilter: null,
	dividedFilter: null,
};

const createEmptySlugMaps = (): SlugMaps => ({
	payer: new Map(),
	category: new Map(),
	financialAccount: new Map(),
	card: new Map(),
});

type OptionSet = ReturnType<typeof buildOptionSets>;

export default async function Page({ params, searchParams }: PageProps) {
	await connection();
	const { payerId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const access = await getPayerAccess(userId, payerId);

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

	const allSearchFilters =
		extractTransactionSearchFilters(resolvedSearchParams);
	const searchFilters = canEdit
		? allSearchFilters
		: {
				...EMPTY_FILTERS,
				searchFilter: allSearchFilters.searchFilter, // Permitir busca mesmo em modo read-only
			};

	let filterSources: Awaited<
		ReturnType<typeof fetchTransactionFilterSources>
	> | null = null;
	let loggedUserFilterSources: Awaited<
		ReturnType<typeof fetchTransactionFilterSources>
	> | null = null;
	let sluggedFilters: SluggedFilters;
	let slugMaps: SlugMaps;

	if (canEdit) {
		filterSources = await fetchTransactionFilterSources(dataOwnerId);
		sluggedFilters = buildSluggedFilters(filterSources);
		slugMaps = buildSlugMaps(sluggedFilters);
	} else {
		// Buscar opções do usuário logado para usar ao importar
		loggedUserFilterSources = await fetchTransactionFilterSources(userId);
		sluggedFilters = {
			payerFiltersRaw: [],
			categoryFiltersRaw: [],
			accountFiltersRaw: [],
			cardFiltersRaw: [],
		};
		slugMaps = createEmptySlugMaps();
	}

	const filters = buildTransactionWhere({
		userId: dataOwnerId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
		payerId: pagador.id,
	});

	const sharesPromise = canEdit
		? fetchPayerShares(pagador.id)
		: Promise.resolve([]);

	const currentUserSharePromise = !canEdit
		? fetchCurrentUserShare(pagador.id, userId)
		: Promise.resolve(null);

	const [
		transactionRows,
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
		fetchPayerMonthlyBreakdown({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPayerHistory({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorCardUsage({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorBoletoStats({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorBoletoItems({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		fetchPagadorPaymentStatus({
			userId: dataOwnerId,
			payerId: pagador.id,
			period: selectedPeriod,
		}),
		sharesPromise,
		currentUserSharePromise,
		fetchRecentEstablishments(userId),
		fetchUserPreferences(userId),
	]);

	const mappedTransactions = mapTransactionsData(transactionRows);
	const transactionData = canEdit
		? mappedTransactions
		: mappedTransactions.map((item) => ({ ...item, readonly: true }));

	const payerSharesData = shareRows;

	let optionSets: OptionSet;
	let loggedUserOptionSets: OptionSet | null = null;
	let effectiveSluggedFilters = sluggedFilters;

	if (canEdit && filterSources) {
		optionSets = buildOptionSets({
			...sluggedFilters,
			payerRows: filterSources.payerRows,
		});
	} else {
		effectiveSluggedFilters = {
			payerFiltersRaw: [
				{
					id: pagador.id,
					label: pagador.name,
					slug: pagador.id,
					role: pagador.role,
					avatarUrl: pagador.avatarUrl,
				},
			],
			categoryFiltersRaw: [],
			accountFiltersRaw: [],
			cardFiltersRaw: [],
		};
		optionSets = buildReadOnlyOptionSets(transactionData, pagador);

		// Construir opções do usuário logado para usar ao importar
		if (loggedUserFilterSources) {
			const loggedUserSluggedFilters = buildSluggedFilters(
				loggedUserFilterSources,
			);
			loggedUserOptionSets = buildOptionSets({
				...loggedUserSluggedFilters,
				payerRows: loggedUserFilterSources.payerRows,
			});
		}
	}

	const payerSlug =
		effectiveSluggedFilters.payerFiltersRaw.find(
			(item) => item.id === pagador.id,
		)?.slug ?? null;

	const payerFilterOptions = payerSlug
		? optionSets.payerFilterOptions.filter(
				(option) => option.slug === payerSlug,
			)
		: optionSets.payerFilterOptions;

	const payerData = {
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
		cardUsage: cardUsage.slice(0, 3).map((item: PayerCardUsageItem) => ({
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
		lancamentoCount: transactionData.length,
	};

	const logoMappings = await prefetchLogoMappings(dataOwnerId, [
		...transactionData.map((t) => t.name),
		...boletoItems.map((b) => b.name),
	]);

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />

			<LogoPrefetchProvider mappings={logoMappings}>
				<Tabs defaultValue="profile" className="w-full">
					<TabsList className="mb-2">
						<TabsTrigger value="profile">Perfil</TabsTrigger>
						<TabsTrigger value="painel">Painel</TabsTrigger>
						<TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
					</TabsList>
					<PayerHeaderCard
						payer={payerData}
						selectedPeriod={selectedPeriod}
						summary={summaryPreview}
					/>

					<TabsContent value="profile" className="space-y-4">
						<PagadorInfoCard payer={payerData} />
						{canEdit && payerData.shareCode ? (
							<PayerSharingCard
								payerId={pagador.id}
								shareCode={payerData.shareCode}
								shares={payerSharesData}
							/>
						) : null}
						{!canEdit && currentUserShare ? (
							<PayerLeaveShareCard
								shareId={currentUserShare.id}
								pagadorName={payerData.name}
								createdAt={currentUserShare.createdAt}
							/>
						) : null}
					</TabsContent>

					<TabsContent value="painel" className="space-y-4">
						<section className="grid gap-3 lg:grid-cols-2">
							<PayerMonthlySummaryCard
								periodLabel={periodLabel}
								breakdown={monthlyBreakdown}
							/>
							<PayerHistoryCard data={historyData} />
						</section>

						<section className="grid gap-3 lg:grid-cols-3">
							<ExpandableWidgetCard
								title="Minhas Faturas"
								subtitle="Valores por cartão neste período"
								icon={<RiBankCard2Line className="size-4" />}
							>
								<PayerCardUsageCard items={cardUsage} />
							</ExpandableWidgetCard>
							<ExpandableWidgetCard
								title="Boletos"
								subtitle="Boletos registrados neste período"
								icon={<RiBarcodeLine className="size-4" />}
							>
								<PayerBoletoCard items={boletoItems} />
							</ExpandableWidgetCard>
							<ExpandableWidgetCard
								title="Status de Pagamento"
								subtitle="Situação das despesas no período"
								icon={<RiWallet3Line className="size-4" />}
							>
								<PayerPaymentStatusCard data={paymentStatus} />
							</ExpandableWidgetCard>
						</section>
					</TabsContent>

					<TabsContent value="lancamentos">
						<section className="flex flex-col gap-4">
							<LancamentosSection
								currentUserId={userId}
								transactions={transactionData}
								payerOptions={optionSets.payerOptions}
								splitPayerOptions={optionSets.splitPayerOptions}
								defaultPayerId={pagador.id}
								accountOptions={optionSets.accountOptions}
								cardOptions={optionSets.cardOptions}
								categoryOptions={optionSets.categoryOptions}
								payerFilterOptions={payerFilterOptions}
								categoryFilterOptions={optionSets.categoryFilterOptions}
								accountCardFilterOptions={optionSets.accountCardFilterOptions}
								selectedPeriod={selectedPeriod}
								estabelecimentos={estabelecimentos}
								allowCreate={canEdit}
								noteAsColumn={userPreferences?.statementNoteAsColumn ?? false}
								columnOrder={userPreferences?.transactionsColumnOrder ?? null}
								attachmentMaxSizeMb={userPreferences?.attachmentMaxSizeMb ?? 50}
								importPayerOptions={loggedUserOptionSets?.payerOptions}
								importSplitPayerOptions={
									loggedUserOptionSets?.splitPayerOptions
								}
								importDefaultPayerId={loggedUserOptionSets?.defaultPayerId}
								importAccountOptions={loggedUserOptionSets?.accountOptions}
								importCardOptions={loggedUserOptionSets?.cardOptions}
								importCategoryOptions={loggedUserOptionSets?.categoryOptions}
							/>
						</section>
					</TabsContent>
				</Tabs>
			</LogoPrefetchProvider>
		</main>
	);
}
