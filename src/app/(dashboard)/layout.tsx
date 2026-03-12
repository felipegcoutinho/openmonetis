import { fetchDashboardNotifications } from "@/features/dashboard/notifications-queries";
import { fetchPendingInboxCount } from "@/features/inbox/queries";
import { AppNavbar } from "@/shared/components/navigation/navbar/app-navbar";
import { FontProvider } from "@/shared/components/providers/font-provider";
import { PrivacyProvider } from "@/shared/components/providers/privacy-provider";
import { getUserSession } from "@/shared/lib/auth/server";
import { fetchPagadoresWithAccess } from "@/shared/lib/payers/access";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { fetchUserFontPreferences } from "@/shared/lib/preferences/fonts";
import { parsePeriodParam } from "@/shared/utils/period";

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
	// Buscar notificações, contagem de pré-lançamentos e preferências de fonte em paralelo
	const [notificationsSnapshot, preLancamentosCount, fontPrefs] =
		await Promise.all([
			fetchDashboardNotifications(session.user.id, currentPeriod),
			fetchPendingInboxCount(session.user.id),
			fetchUserFontPreferences(session.user.id),
		]);

	return (
		<FontProvider
			systemFont={fontPrefs.systemFont}
			moneyFont={fontPrefs.moneyFont}
		>
			<PrivacyProvider>
				<AppNavbar
					user={{ ...session.user, image: session.user.image ?? null }}
					pagadorAvatarUrl={adminPagador?.avatarUrl ?? null}
					preLancamentosCount={preLancamentosCount}
					notificationsSnapshot={notificationsSnapshot}
				/>
				<div className="relative flex flex-1 flex-col pt-16">
					<div className="pointer-events-none absolute inset-0" />
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-5 md:gap-6 w-full max-w-8xl mx-auto px-4 ">
							{children}
						</div>
					</div>
				</div>
			</PrivacyProvider>
		</FontProvider>
	);
}
