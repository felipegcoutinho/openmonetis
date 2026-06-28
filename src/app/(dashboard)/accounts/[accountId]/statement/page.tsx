import { RiPencilLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AccountDialog } from "@/features/accounts/components/account-dialog";
import { AccountStatementCard } from "@/features/accounts/components/account-statement-card";
import { AddYieldDialog } from "@/features/accounts/components/add-yield-dialog";
import { AdjustBalanceDialog } from "@/features/accounts/components/adjust-balance-dialog";
import type { Account } from "@/features/accounts/components/types";
import {
	fetchAccountData,
	fetchAccountSummary,
	fetchAccountTransactionsPage,
} from "@/features/accounts/statement-queries";
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
	resolveTransactionPagination,
} from "@/features/transactions/lib/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { Button } from "@/shared/components/ui/button";
import { getUserId } from "@/shared/lib/auth/server";
import { loadLogoOptions } from "@/shared/lib/logo/options";
import { getBusinessDateString } from "@/shared/utils/date";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ accountId: string }>;
	searchParams?: PageSearchParams;
};

const capitalize = (value: string) =>
	value.length > 0 ? value[0]?.toUpperCase().concat(value.slice(1)) : value;

const resolveDefaultPaymentMethod = (
	accountType: string | null | undefined,
) => {
	if (accountType === "Dinheiro") return "Dinheiro";
	if (accountType === "Pré-Pago | VR/VA") return "Pré-Pago | VR/VA";

	return "Pix";
};

const resolveDefaultYieldDate = (period: string) => {
	const today = getBusinessDateString();
	if (today.startsWith(period)) return today;

	const [year, month] = period.split("-").map((part) => Number(part));
	if (!year || !month) return today;

	const lastDay = new Date(year, month, 0).getDate();
	return `${period}-${String(lastDay).padStart(2, "0")}`;
};

export default async function Page({ params, searchParams }: PageProps) {
	await connection();
	const { accountId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const {
		period: selectedPeriod,
		monthName,
		year,
	} = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractTransactionSearchFilters(resolvedSearchParams);
	const pagination = resolveTransactionPagination(resolvedSearchParams);

	const account = await fetchAccountData(userId, accountId);

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
		fetchTransactionFilterSources(userId),
		loadLogoOptions(),
		fetchAccountSummary(userId, accountId, selectedPeriod),
		fetchRecentEstablishments(userId),
		fetchUserPreferences(userId),
	]);
	const sluggedFilters = buildSluggedFilters(filterSources);
	const slugMaps = buildSlugMaps(sluggedFilters);

	const filters = buildTransactionWhere({
		userId,
		period: selectedPeriod,
		filters: searchFilters,
		slugMaps,
		accountId: account.id,
		hideAnticipatedInstallments:
			userPreferences?.hideAnticipatedInstallments ?? false,
	});

	const transactionsPage = await fetchAccountTransactionsPage(
		filters,
		pagination,
	);

	const transactionData = mapTransactionsData(transactionsPage.rows);

	const { openingBalance, currentBalance, totalIncomes, totalExpenses } =
		accountSummary;

	const periodLabel = `${capitalize(monthName)} de ${year}`;
	const defaultYieldDate = resolveDefaultYieldDate(selectedPeriod);

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
		payerOptions,
		splitPayerOptions,
		defaultPayerId,
		accountOptions,
		cardOptions,
		categoryOptions,
		payerFilterOptions,
		categoryFilterOptions,
		accountCardFilterOptions,
	} = buildOptionSets({
		...sluggedFilters,
		payerRows: filterSources.payerRows,
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
				balanceAdjustment={
					<>
						<AddYieldDialog
							accountId={account.id}
							defaultDate={defaultYieldDate}
						/>
						<AdjustBalanceDialog
							accountId={account.id}
							period={selectedPeriod}
							currentBalance={currentBalance}
						/>
					</>
				}
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
					transactions={transactionData}
					payerOptions={payerOptions}
					splitPayerOptions={splitPayerOptions}
					defaultPayerId={defaultPayerId}
					accountOptions={accountOptions}
					cardOptions={cardOptions}
					categoryOptions={categoryOptions}
					payerFilterOptions={payerFilterOptions}
					categoryFilterOptions={categoryFilterOptions}
					accountCardFilterOptions={accountCardFilterOptions}
					selectedPeriod={selectedPeriod}
					estabelecimentos={estabelecimentos}
					pagination={{
						page: transactionsPage.page,
						pageSize: transactionsPage.pageSize,
						totalItems: transactionsPage.totalItems,
						totalPages: transactionsPage.totalPages,
					}}
					exportContext={{
						source: "account-statement",
						period: selectedPeriod,
						filters: searchFilters,
						accountId: account.id,
						settledOnly: true,
					}}
					allowCreate
					defaultAccountId={account.id}
					defaultPaymentMethod={resolveDefaultPaymentMethod(
						account.accountType,
					)}
					noteAsColumn={userPreferences?.statementNoteAsColumn ?? false}
					columnOrder={userPreferences?.transactionsColumnOrder ?? null}
					groupTransactionsByDate={
						userPreferences?.groupTransactionsByDate ?? true
					}
					attachmentMaxSizeMb={userPreferences?.attachmentMaxSizeMb ?? 50}
				/>
			</section>
		</main>
	);
}
