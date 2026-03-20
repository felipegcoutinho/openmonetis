import { fetchDashboardNavbarData } from "@/features/dashboard/navbar-queries";
import { AppNavbar } from "@/shared/components/navigation/navbar/app-navbar";
import { PrivacyProvider } from "@/shared/components/providers/privacy-provider";
import { DotPattern } from "@/shared/components/ui/dot-pattern";
import { getUserSession } from "@/shared/lib/auth/server";
import { parsePeriodParam } from "@/shared/utils/period";

export default async function DashboardLayout({
	children,
	searchParams,
}: Readonly<{
	children: React.ReactNode;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
	const session = await getUserSession();

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
	const navbarData = await fetchDashboardNavbarData(
		session.user.id,
		currentPeriod,
	);

	return (
		<PrivacyProvider>
			<AppNavbar
				user={{ ...session.user, image: session.user.image ?? null }}
				pagadorAvatarUrl={navbarData.pagadorAvatarUrl}
				preLancamentosCount={navbarData.preLancamentosCount}
				notificationsSnapshot={navbarData.notificationsSnapshot}
			/>
			<div className="relative flex flex-1 flex-col pt-16">
				<div className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
					<DotPattern
						width={20}
						height={20}
						cx={1.25}
						cy={1.25}
						cr={1.25}
						className="text-primary/10 mask-[linear-gradient(to_bottom,black_0%,transparent_100%)]"
					/>
					<div className="absolute inset-0 bg-linear-to-b from-primary/6 to-transparent" />
				</div>
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-5 md:gap-6 w-full max-w-8xl mx-auto px-4 ">
						{children}
					</div>
				</div>
			</div>
		</PrivacyProvider>
	);
}
