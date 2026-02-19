import { FontProvider } from "@/components/font-provider";
import { SiteHeader } from "@/components/header-dashboard";
import { PrivacyProvider } from "@/components/privacy-provider";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserSession } from "@/lib/auth/server";
import { fetchDashboardNotifications } from "@/lib/dashboard/notifications";
import { fetchPagadoresWithAccess } from "@/lib/pagadores/access";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { fetchUserFontPreferences } from "@/lib/preferences/fonts";
import { parsePeriodParam } from "@/lib/utils/period";
import { fetchPendingInboxCount } from "./pre-lancamentos/data";

export default async function DashboardLayout({
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
		(p) => p.role === PAGADOR_ROLE_ADMIN && p.userId === session.user.id,
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
		singlePeriodoParam ?? null,
	);
	const notificationsSnapshot = await fetchDashboardNotifications(
		session.user.id,
		currentPeriod,
	);

	// Buscar contagem de pré-lançamentos pendentes e preferências de fonte
	const [preLancamentosCount, fontPrefs] = await Promise.all([
		fetchPendingInboxCount(session.user.id),
		fetchUserFontPreferences(session.user.id),
	]);

	return (
		<FontProvider
			systemFont={fontPrefs.systemFont}
			moneyFont={fontPrefs.moneyFont}
		>
			<PrivacyProvider>
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
						preLancamentosCount={preLancamentosCount}
						variant="sidebar"
					/>
					<SidebarInset>
						<SiteHeader notificationsSnapshot={notificationsSnapshot} />
						<div className="flex flex-1 flex-col pt-12 md:pt-0">
							<div className="@container/main flex flex-1 flex-col gap-2">
								<div className="flex flex-col gap-4 py-4 md:gap-6">
									{children}
								</div>
							</div>
						</div>
					</SidebarInset>
				</SidebarProvider>
			</PrivacyProvider>
		</FontProvider>
	);
}
