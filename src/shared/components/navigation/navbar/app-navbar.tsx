import { AnimatedThemeToggler } from "@/shared/components/animated-theme-toggler";
import { NotificationBell } from "@/shared/components/navigation/navbar/notification-bell";
import { RefreshPageButton } from "@/shared/components/refresh-page-button";
import type { DashboardNotificationsSnapshot } from "@/shared/lib/types/notifications";
import { NavMenu } from "./nav-menu";
import { NavbarShell } from "./navbar-shell";
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
		<NavbarShell logoHref="/dashboard" fixed>
			<NavMenu />
			<div className="ml-auto flex items-center gap-2">
				<NotificationBell
					notifications={notificationsSnapshot.notifications}
					unreadCount={notificationsSnapshot.unreadCount}
					visibleCount={notificationsSnapshot.visibleCount}
					budgetNotifications={notificationsSnapshot.budgetNotifications}
					preLancamentosCount={preLancamentosCount}
				/>
				<RefreshPageButton variant="navbar" />
				<AnimatedThemeToggler variant="navbar" />
			</div>
			<NavbarUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
		</NavbarShell>
	);
}
