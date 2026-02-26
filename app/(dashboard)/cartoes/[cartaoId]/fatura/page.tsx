import { RiPencilLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import { fetchUserPreferences } from "@/app/(dashboard)/ajustes/data";
import { getRecentEstablishmentsAction } from "@/app/(dashboard)/lancamentos/actions";
import { CardDialog } from "@/components/cartoes/card-dialog";
import type { Card } from "@/components/cartoes/types";
import { InvoiceSummaryCard } from "@/components/faturas/invoice-summary-card";
import { LancamentosPage as LancamentosSection } from "@/components/lancamentos/page/lancamentos-page";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { Button } from "@/components/ui/button";
import type { Conta } from "@/db/schema";
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
import { fetchCardData, fetchCardLancamentos, fetchInvoiceData } from "./data";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	params: Promise<{ cartaoId: string }>;
	searchParams?: PageSearchParams;
};

export default async function Page({ params, searchParams }: PageProps) {
	const { cartaoId } = await params;
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;

	const periodoParamRaw = getSingleParam(resolvedSearchParams, "periodo");
	const {
		period: selectedPeriod,
		monthName,
		year,
	} = parsePeriodParam(periodoParamRaw);

	const searchFilters = extractLancamentoSearchFilters(resolvedSearchParams);

	const card = await fetchCardData(userId, cartaoId);

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
		fetchLancamentoFilterSources(userId),
		loadLogoOptions(),
		fetchInvoiceData(userId, cartaoId, selectedPeriod),
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
		cardId: card.id,
	});

	const lancamentoRows = await fetchCardLancamentos(filters);

	const lancamentosData = mapLancamentosData(lancamentoRows);

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
		limitCartaoId: card.id,
	});

	const accountOptions = filterSources.contaRows.map((conta: Conta) => ({
		id: conta.id,
		name: conta.name ?? "Conta",
	}));

	const contaName =
		filterSources.contaRows.find((conta: Conta) => conta.id === card.contaId)
			?.name ?? "Conta";

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
		contaId: card.contaId,
		contaName,
		limitInUse: null,
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
					cartaoId={card.id}
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
							accounts={accountOptions}
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
					allowCreate
					noteAsColumn={userPreferences?.extratoNoteAsColumn ?? false}
					columnOrder={userPreferences?.lancamentosColumnOrder ?? null}
					defaultCartaoId={card.id}
					defaultPaymentMethod="Cartão de crédito"
					lockCartaoSelection
					lockPaymentMethod
				/>
			</section>
		</main>
	);
}
