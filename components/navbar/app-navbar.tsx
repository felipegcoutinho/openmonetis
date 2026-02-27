import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { NotificationBell } from "@/components/notificacoes/notification-bell";
import { RefreshPageButton } from "@/components/refresh-page-button";
import type { DashboardNotificationsSnapshot } from "@/lib/dashboard/notifications";
import { Logo } from "../logo";
import { NavMenu } from "./nav-menu";
import { NavbarUser } from "./navbar-user";

type AppNavbarProps = {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	pagadorAvatarUrl: string | null;
	preLancamentosCount?: number;
	notificationsSnapshot: DashboardNotificationsSnapshot;
};

export function AppNavbar({
	user,
	pagadorAvatarUrl,
	preLancamentosCount = 0,
	notificationsSnapshot,
}: AppNavbarProps) {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 h-15 shrink-0 flex items-center bg-card backdrop-blur-lg supports-backdrop-filter:bg-card/60">
			<div className="w-full max-w-8xl mx-auto px-4 flex items-center gap-4 h-full">
				{/* Logo */}
				<Link href="/dashboard" className="shrink-0 mr-1">
					<Logo variant="compact" />
				</Link>

				{/* Navigation */}
				<NavMenu />

				{/* Right-side actions */}
				<div className="ml-auto flex items-center gap-2">
					<NotificationBell
						notifications={notificationsSnapshot.notifications}
						totalCount={notificationsSnapshot.totalCount}
						budgetNotifications={notificationsSnapshot.budgetNotifications}
						preLancamentosCount={preLancamentosCount}
					/>
					<RefreshPageButton />
					<AnimatedThemeToggler />
				</div>

				{/* User avatar */}
				<NavbarUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
			</div>
		</header>
	);
}
