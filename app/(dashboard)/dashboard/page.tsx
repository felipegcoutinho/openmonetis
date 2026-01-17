import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { SectionCards } from "@/components/dashboard/section-cards";
import MonthNavigation from "@/components/month-picker/month-navigation";
import { getUser } from "@/lib/auth/server";
import { fetchDashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import { parsePeriodParam } from "@/lib/utils/period";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

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

  const [data, preferencesResult] = await Promise.all([
    fetchDashboardData(user.id, selectedPeriod),
    db
      .select({
        disableMagnetlines: schema.userPreferences.disableMagnetlines,
      })
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1),
  ]);

  const disableMagnetlines = preferencesResult[0]?.disableMagnetlines ?? false;

  return (
    <main className="flex flex-col gap-4 px-6">
      <DashboardWelcome name={user.name} disableMagnetlines={disableMagnetlines} />
      <MonthNavigation />
      <SectionCards metrics={data.metrics} />
      <DashboardGrid data={data} period={selectedPeriod} />
    </main>
  );
}
