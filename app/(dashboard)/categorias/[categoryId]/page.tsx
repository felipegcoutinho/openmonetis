import { getRecentEstablishmentsAction } from "@/app/(dashboard)/lancamentos/actions";
import { CategoryDetailHeader } from "@/components/categorias/category-detail-header";
import { LancamentosPage } from "@/components/lancamentos/page/lancamentos-page";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { fetchCategoryDetails } from "@/lib/dashboard/categories/category-details";
import { getUserId } from "@/lib/auth/server";
import {
  buildOptionSets,
  buildSluggedFilters,
  fetchLancamentoFilterSources,
} from "@/lib/lancamentos/page-helpers";
import { displayPeriod, parsePeriodParam } from "@/lib/utils/period";
import { notFound } from "next/navigation";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams?: PageSearchParams;
};

const getSingleParam = (
  params: Record<string, string | string[] | undefined> | undefined,
  key: string
) => {
  const value = params?.[key];
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { categoryId } = await params;
  const userId = await getUserId();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
  const { period: selectedPeriod } = parsePeriodParam(periodoParam);

  const [detail, filterSources, estabelecimentos] =
    await Promise.all([
      fetchCategoryDetails(userId, categoryId, selectedPeriod),
      fetchLancamentoFilterSources(userId),
      getRecentEstablishmentsAction(),
    ]);

  if (!detail) {
    notFound();
  }

  const sluggedFilters = buildSluggedFilters(filterSources);
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
  });

  const currentPeriodLabel = displayPeriod(detail.period);
  const previousPeriodLabel = displayPeriod(detail.previousPeriod);

  return (
    <main className="flex flex-col gap-6">
      <MonthNavigation />
      <CategoryDetailHeader
        category={detail.category}
        currentPeriodLabel={currentPeriodLabel}
        previousPeriodLabel={previousPeriodLabel}
        currentTotal={detail.currentTotal}
        previousTotal={detail.previousTotal}
        percentageChange={detail.percentageChange}
        transactionCount={detail.transactions.length}
      />
      <LancamentosPage
        lancamentos={detail.transactions}
        pagadorOptions={pagadorOptions}
        splitPagadorOptions={splitPagadorOptions}
        defaultPagadorId={defaultPagadorId}
        contaOptions={contaOptions}
        cartaoOptions={cartaoOptions}
        categoriaOptions={categoriaOptions}
        pagadorFilterOptions={pagadorFilterOptions}
        categoriaFilterOptions={categoriaFilterOptions}
        contaCartaoFilterOptions={contaCartaoFilterOptions}
        selectedPeriod={detail.period}
        estabelecimentos={estabelecimentos}
        allowCreate={true}
      />
    </main>
  );
}
