import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { SectionCards } from "@/components/dashboard/section-cards";
import MonthPicker from "@/components/month-picker/month-picker";
import { getUser } from "@/lib/auth/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import { parsePeriodParam } from "@/lib/utils/period";

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

export default async function Page({ searchParams }: PageProps) {
  const user = await getUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
  const { period: selectedPeriod } = parsePeriodParam(periodoParam);

  const data = await fetchDashboardData(user.id, selectedPeriod);

  return (
    <main className="flex flex-col gap-4 px-6">
      <DashboardWelcome name={user.name} />
      <MonthPicker />
      <SectionCards metrics={data.metrics} />
      <DashboardGrid data={data} period={selectedPeriod} />
    </main>
  );
}
