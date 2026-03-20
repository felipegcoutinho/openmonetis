import Link from "next/link";
import type { DashboardNotificationsSnapshot } from "@/features/dashboard/notifications-queries";
import { AnimatedThemeToggler } from "@/shared/components/animated-theme-toggler";
import { Logo } from "@/shared/components/logo";
import { NotificationBell } from "@/shared/components/navigation/navbar/notification-bell";
import { RefreshPageButton } from "@/shared/components/refresh-page-button";
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

const navbarActionClassName =
	"border-black/10 bg-transparent text-black/75 shadow-none hover:border-black/20 hover:bg-black/10 hover:text-black focus-visible:ring-black/20 data-[state=open]:bg-black/10 data-[state=open]:text-black";

export function AppNavbar({
	user,
	pagadorAvatarUrl,
	preLancamentosCount = 0,
	notificationsSnapshot,
}: AppNavbarProps) {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 flex h-16 shrink-0 items-center bg-primary">
			<div className="relative z-10 mx-auto flex h-full w-full max-w-8xl items-center gap-4 px-4">
				<Link href="/dashboard" className="shrink-0 mr-1">
					<Logo variant="compact" invertTextOnDark={false} />
				</Link>

				<NavMenu />

				<div className="ml-auto flex items-center gap-2">
					<NotificationBell
						notifications={notificationsSnapshot.notifications}
						totalCount={notificationsSnapshot.totalCount}
						budgetNotifications={notificationsSnapshot.budgetNotifications}
						preLancamentosCount={preLancamentosCount}
					/>
					<RefreshPageButton className={navbarActionClassName} />
					<AnimatedThemeToggler className={navbarActionClassName} />
				</div>

				<NavbarUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
			</div>
		</header>
	);
}
