import { RiPencilLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import type { FinancialAccount } from "@/db/schema";
import { CardDialog } from "@/features/cards/components/card-dialog";
import type { Card } from "@/features/cards/components/types";
import { InvoiceSummaryCard } from "@/features/invoices/components/invoice-summary-card";
import {
	fetchCardData,
	fetchCardTransactions,
	fetchInvoiceData,
} from "@/features/invoices/queries";
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
} from "@/features/transactions/page-helpers";
import {
	fetchRecentEstablishments,
	fetchTransactionFilterSources,
} from "@/features/transactions/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { Button } from "@/shared/components/ui/button";
import { getUserId } from "@/shared/lib/auth/server";
import { loadLogoOptions } from "@/shared/lib/logo/options";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ cardId: string }>;
	searchParams?: PageSearchParams;
};

export default async function Page({ params, searchParams }: PageProps) {
	const { cardId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const {
		period: selectedPeriod,
		monthName,
		year,
	} = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractTransactionSearchFilters(resolvedSearchParams);

	const card = await fetchCardData(userId, cardId);

	if (!card) {
		notFound();
	}

	const [
		filterSources,
		logoOptions,
		invoiceData,
		estabelecimentos,
		userPreferences,
	] = await Promise.all([
		fetchTransactionFilterSources(userId),
		loadLogoOptions(),
		fetchInvoiceData(userId, cardId, selectedPeriod),
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
		cardId: card.id,
	});

	const transactionRows = await fetchCardTransactions(filters);

	const transactionData = mapTransactionsData(transactionRows);

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
		limitCartaoId: card.id,
	});

	const cardDialogAccounts = filterSources.accountRows.map(
		(financialAccount: FinancialAccount) => ({
			id: financialAccount.id,
			name: financialAccount.name ?? "Conta",
			logo: financialAccount.logo ?? null,
		}),
	);

	const accountName =
		filterSources.accountRows.find(
			(financialAccount: FinancialAccount) =>
				financialAccount.id === card.accountId,
		)?.name ?? "Conta";

	const cardDialogData: Card = {
		id: card.id,
		name: card.name,
		brand: card.brand ?? "",
		status: card.status ?? "",
		closingDay: card.closingDay,
		dueDay: card.dueDay,
		note: card.note ?? null,
		logo: card.logo,
		limit:
			card.limit !== null && card.limit !== undefined
				? Number(card.limit)
				: null,
		accountId: card.accountId,
		accountName,
		limitInUse: 0,
		limitAvailable: null,
	};

	const { totalAmount, invoiceStatus, paymentDate } = invoiceData;
	const limitAmount =
		card.limit !== null && card.limit !== undefined ? Number(card.limit) : null;

	const periodLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(
		1,
	)} de ${year}`;

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />

			<section className="flex flex-col gap-4">
				<InvoiceSummaryCard
					cardId={card.id}
					period={selectedPeriod}
					cardName={card.name}
					cardBrand={card.brand ?? null}
					cardStatus={card.status ?? null}
					closingDay={card.closingDay}
					dueDay={card.dueDay}
					periodLabel={periodLabel}
					totalAmount={totalAmount}
					limitAmount={limitAmount}
					invoiceStatus={invoiceStatus}
					paymentDate={paymentDate}
					logo={card.logo}
					actions={
						<CardDialog
							mode="update"
							card={cardDialogData}
							logoOptions={logoOptions}
							accounts={cardDialogAccounts}
							trigger={
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="text-muted-foreground hover:text-foreground"
									aria-label="Editar cartão"
								>
									<RiPencilLine className="size-4" />
								</Button>
							}
						/>
					}
				/>
			</section>

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
					allowCreate
					noteAsColumn={userPreferences?.statementNoteAsColumn ?? false}
					columnOrder={userPreferences?.transactionsColumnOrder ?? null}
					defaultCardId={card.id}
					defaultPaymentMethod="Cartão de crédito"
					lockCardSelection
					lockPaymentMethod
				/>
			</section>
		</main>
	);
}
