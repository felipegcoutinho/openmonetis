import MonthNavigation from "@/components/month-picker/month-navigation";
import { BudgetsPage } from "@/components/orcamentos/budgets-page";
import { getUserId } from "@/lib/auth/server";
import { parsePeriodParam } from "@/lib/utils/period";
import { fetchBudgetsForUser } from "./data";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
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

const capitalize = (value: string) =>
  value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);

export default async function Page({ searchParams }: PageProps) {
  const userId = await getUserId();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const periodoParam = getSingleParam(resolvedSearchParams, "periodo");

  const {
    period: selectedPeriod,
    monthName: rawMonthName,
    year,
  } = parsePeriodParam(periodoParam);

  const periodLabel = `${capitalize(rawMonthName)} ${year}`;

  const { budgets, categoriesOptions } = await fetchBudgetsForUser(userId, selectedPeriod);

  return (
    <main className="flex flex-col gap-6">
      <MonthNavigation />
      <BudgetsPage
        budgets={budgets}
        categories={categoriesOptions}
        selectedPeriod={selectedPeriod}
        periodLabel={periodLabel}
      />
    </main>
  );
}
