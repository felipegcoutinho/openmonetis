import { SiteHeader } from "@/components/header-dashboard";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserSession } from "@/lib/auth/server";
import { fetchDashboardNotifications } from "@/lib/dashboard/notifications";
import { fetchPagadoresWithAccess } from "@/lib/pagadores/access";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { parsePeriodParam } from "@/lib/utils/period";

export default async function layout({
  children,
  searchParams,
}: Readonly<{
  children: React.ReactNode;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const session = await getUserSession();
  const pagadoresList = await fetchPagadoresWithAccess(session.user.id);

  // Encontrar o pagador admin do usuário
  const adminPagador = pagadoresList.find(
    (p) => p.role === PAGADOR_ROLE_ADMIN && p.userId === session.user.id
  );

  // Buscar notificações para o período atual
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const periodoParam = resolvedSearchParams?.periodo;
  const singlePeriodoParam =
    typeof periodoParam === "string"
      ? periodoParam
      : Array.isArray(periodoParam)
      ? periodoParam[0]
      : null;
  const { period: currentPeriod } = parsePeriodParam(
    singlePeriodoParam ?? null
  );
  const notificationsSnapshot = await fetchDashboardNotifications(
    session.user.id,
    currentPeriod
  );

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ ...session.user, image: session.user.image ?? null }}
        pagadorAvatarUrl={adminPagador?.avatarUrl ?? null}
        pagadores={pagadoresList.map((item) => ({
          id: item.id,
          name: item.name,
          avatarUrl: item.avatarUrl,
          canEdit: item.canEdit,
        }))}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader notificationsSnapshot={notificationsSnapshot} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
