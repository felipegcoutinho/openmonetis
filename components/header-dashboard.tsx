import { ChangelogNotification } from "@/components/changelog/changelog-notification";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { NotificationBell } from "@/components/notificacoes/notification-bell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth/server";
import { getUnreadUpdates } from "@/lib/changelog/data";
import type { DashboardNotificationsSnapshot } from "@/lib/dashboard/notifications";
import { AnimatedThemeToggler } from "./animated-theme-toggler";
import LogoutButton from "./auth/logout-button";
import { CalculatorDialogButton } from "./calculadora/calculator-dialog";
import { PrivacyModeToggle } from "./privacy-mode-toggle";

type SiteHeaderProps = {
  notificationsSnapshot: DashboardNotificationsSnapshot;
};

export async function SiteHeader({ notificationsSnapshot }: SiteHeaderProps) {
  const user = await getUser();
  const { unreadCount, allEntries } = await getUnreadUpdates(user.id);

  return (
    <header className="border-b flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell
            notifications={notificationsSnapshot.notifications}
            totalCount={notificationsSnapshot.totalCount}
          />
          <CalculatorDialogButton withTooltip />
          <PrivacyModeToggle />
          <AnimatedThemeToggler />
          <span className="text-muted-foreground">|</span>
          <ChangelogNotification
            unreadCount={unreadCount}
            entries={allEntries}
          />
          <FeedbackDialog />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
