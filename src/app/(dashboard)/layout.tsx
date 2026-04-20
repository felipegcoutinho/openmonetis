import { connection } from "next/server";
import { fetchDashboardNavbarData } from "@/features/dashboard/navbar-queries";
import { AppNavbar } from "@/shared/components/navigation/navbar/app-navbar";
import { LogoDevProvider } from "@/shared/components/providers/logo-dev-provider";
import { PrivacyProvider } from "@/shared/components/providers/privacy-provider";
import { getUserSession } from "@/shared/lib/auth/server";
import { isLogoDevEnabled } from "@/shared/lib/logo/server";

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	await connection();
	const session = await getUserSession();
	const navbarData = await fetchDashboardNavbarData(session.user.id);
	const logoDevEnabled = isLogoDevEnabled();

	return (
		<LogoDevProvider enabled={logoDevEnabled}>
			<PrivacyProvider>
				<AppNavbar
					user={{ ...session.user, image: session.user.image ?? null }}
					pagadorAvatarUrl={navbarData.pagadorAvatarUrl}
					preLancamentosCount={navbarData.preLancamentosCount}
					notificationsSnapshot={navbarData.notificationsSnapshot}
				/>
				<div className="relative flex flex-1 flex-col pt-16">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-5 md:gap-6 w-full max-w-8xl mx-auto px-4 ">
							{children}
						</div>
					</div>
				</div>
			</PrivacyProvider>
		</LogoDevProvider>
	);
}
