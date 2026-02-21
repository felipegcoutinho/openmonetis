import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { NotificationBell } from "@/components/notificacoes/notification-bell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth/server";
import type { DashboardNotificationsSnapshot } from "@/lib/dashboard/notifications";
import { AnimatedThemeToggler } from "./animated-theme-toggler";
import LogoutButton from "./auth/logout-button";
import { CalculatorDialogButton } from "./calculadora/calculator-dialog";
import { PrivacyModeToggle } from "./privacy-mode-toggle";
import { RefreshPageButton } from "./refresh-page-button";

type SiteHeaderProps = {
	notificationsSnapshot: DashboardNotificationsSnapshot;
};

export async function SiteHeader({ notificationsSnapshot }: SiteHeaderProps) {
	const _user = await getUser();

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b bg-background md:static md:z-auto flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<div className="ml-auto flex items-center gap-2">
					<NotificationBell
						notifications={notificationsSnapshot.notifications}
						totalCount={notificationsSnapshot.totalCount}
					/>
					<CalculatorDialogButton withTooltip />
					<RefreshPageButton />
					<PrivacyModeToggle />
					<AnimatedThemeToggler />
					<span className="text-muted-foreground">|</span>
					<FeedbackDialog />
					<LogoutButton />
				</div>
			</div>
		</header>
	);
}
