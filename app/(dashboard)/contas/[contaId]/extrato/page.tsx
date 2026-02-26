import { RiPencilLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import { fetchUserPreferences } from "@/app/(dashboard)/ajustes/data";
import { getRecentEstablishmentsAction } from "@/app/(dashboard)/lancamentos/actions";
import { AccountDialog } from "@/components/contas/account-dialog";
import { AccountStatementCard } from "@/components/contas/account-statement-card";
import type { Account } from "@/components/contas/types";
import { LancamentosPage as LancamentosSection } from "@/components/lancamentos/page/lancamentos-page";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { Button } from "@/components/ui/button";
import { getUserId } from "@/lib/auth/server";
import {
	buildLancamentoWhere,
	buildOptionSets,
	buildSluggedFilters,
	buildSlugMaps,
	extractLancamentoSearchFilters,
	fetchLancamentoFilterSources,
	getSingleParam,
	mapLancamentosData,
	type ResolvedSearchParams,
} from "@/lib/lancamentos/page-helpers";
import { loadLogoOptions } from "@/lib/logo/options";
import { parsePeriodParam } from "@/lib/utils/period";
import {
	fetchAccountData,
	fetchAccountLancamentos,
	fetchAccountSummary,
} from "./data";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ contaId: string }>;
	searchParams?: PageSearchParams;
};

const capitalize = (value: string) =>
	value.length > 0 ? value[0]?.toUpperCase().concat(value.slice(1)) : value;

export default async function Page({ params, searchParams }: PageProps) {
	const { contaId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const {
		period: selectedPeriod,
		monthName,
		year,
	} = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractLancamentoSearchFilters(resolvedSearchParams);

	const account = await fetchAccountData(userId, contaId);

	if (!account) {
		notFound();
	}

	const [
		filterSources,
		logoOptions,
		accountSummary,
		estabelecimentos,
		userPreferences,
	] = await Promise.all([
		fetchLancamentoFilterSources(userId),
		loadLogoOptions(),
		fetchAccountSummary(userId, contaId, selectedPeriod),
		getRecentEstablishmentsAction(),
		fetchUserPreferences(userId),
	]);
	const sluggedFilters = buildSluggedFilters(filterSources);
	const slugMaps = buildSlugMaps(sluggedFilters);

	const filters = buildLancamentoWhere({
		userId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
		accountId: account.id,
	});

	const lancamentoRows = await fetchAccountLancamentos(filters);

	const lancamentosData = mapLancamentosData(lancamentoRows);

	const { openingBalance, currentBalance, totalIncomes, totalExpenses } =
		accountSummary;

	const periodLabel = `${capitalize(monthName)} de ${year}`;

	const accountDialogData: Account = {
		id: account.id,
		name: account.name,
		accountType: account.accountType,
		status: account.status,
		note: account.note,
		logo: account.logo,
		initialBalance: Number(account.initialBalance ?? 0),
		balance: currentBalance,
	};

	const {
		pagadorOptions,
		splitPagadorOptions,
		defaultPagadorId,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
		pagadorFilterOptions,
		categoriaFilterOptions,
		contaCartaoFilterOptions,
	} = buildOptionSets({
		...sluggedFilters,
		pagadorRows: filterSources.pagadorRows,
		limitContaId: account.id,
	});

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />

			<AccountStatementCard
				accountName={account.name}
				accountType={account.accountType}
				status={account.status}
				periodLabel={periodLabel}
				openingBalance={openingBalance}
				currentBalance={currentBalance}
				totalIncomes={totalIncomes}
				totalExpenses={totalExpenses}
				logo={account.logo}
				actions={
					<AccountDialog
						mode="update"
						account={accountDialogData}
						logoOptions={logoOptions}
						trigger={
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="text-muted-foreground hover:text-foreground"
								aria-label="Editar conta"
							>
								<RiPencilLine className="size-4" />
							</Button>
						}
					/>
				}
			/>

			<section className="flex flex-col gap-4">
				<LancamentosSection
					currentUserId={userId}
					lancamentos={lancamentosData}
					pagadorOptions={pagadorOptions}
					splitPagadorOptions={splitPagadorOptions}
					defaultPagadorId={defaultPagadorId}
					contaOptions={contaOptions}
					cartaoOptions={cartaoOptions}
					categoriaOptions={categoriaOptions}
					pagadorFilterOptions={pagadorFilterOptions}
					categoriaFilterOptions={categoriaFilterOptions}
					contaCartaoFilterOptions={contaCartaoFilterOptions}
					selectedPeriod={selectedPeriod}
					estabelecimentos={estabelecimentos}
					allowCreate={false}
					noteAsColumn={userPreferences?.extratoNoteAsColumn ?? false}
					columnOrder={userPreferences?.lancamentosColumnOrder ?? null}
				/>
			</section>
		</main>
	);
}
