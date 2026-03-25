"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
} from "@/shared/components/ui/dropdown-menu";
import { NotificationBellContent } from "./notification-bell/notification-bell-content";
import { NotificationBellEmptyState } from "./notification-bell/notification-bell-empty-state";
import { NotificationBellHeader } from "./notification-bell/notification-bell-header";
import { NotificationBellTrigger } from "./notification-bell/notification-bell-trigger";
import type { NotificationBellProps } from "./notification-bell/types";
import { useNotificationBell } from "./notification-bell/use-notification-bell";

export function NotificationBell(props: NotificationBellProps) {
	const {
		open,
		setOpen,
		viewMode,
		setViewMode,
		displayCount,
		hasUnreadNotifications,
		hasAnySourceItems,
		headerCountLabel,
		hasDashboardNotificationItems,
		hasArchivedItems,
		archivedDashboardCount,
		hasVisibleItems,
		displayedPreLancamentosCount,
		displayedBudgetNotifications,
		invoiceNotifications,
		boletoNotifications,
		handleInboxNavigate,
		handleNotificationNavigate,
		handleToggleRead,
		handleToggleArchive,
		showArchived,
	} = useNotificationBell(props);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<NotificationBellTrigger
				open={open}
				hasAnySourceItems={hasAnySourceItems}
				hasUnreadNotifications={hasUnreadNotifications}
				displayCount={displayCount}
			/>

			<DropdownMenuContent
				align="end"
				sideOffset={12}
				className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg p-0 shadow-lg"
			>
				<NotificationBellHeader
					hasAnySourceItems={hasAnySourceItems}
					headerCountLabel={headerCountLabel}
					hasDashboardNotificationItems={hasDashboardNotificationItems}
					viewMode={viewMode}
					hasArchivedItems={hasArchivedItems}
					archivedDashboardCount={archivedDashboardCount}
					onViewModeChange={setViewMode}
				/>

				{hasVisibleItems ? (
					<NotificationBellContent
						displayedPreLancamentosCount={displayedPreLancamentosCount}
						displayedBudgetNotifications={displayedBudgetNotifications}
						invoiceNotifications={invoiceNotifications}
						boletoNotifications={boletoNotifications}
						onInboxNavigate={handleInboxNavigate}
						onNotificationNavigate={handleNotificationNavigate}
						onToggleRead={handleToggleRead}
						onToggleArchive={handleToggleArchive}
					/>
				) : (
					<NotificationBellEmptyState
						showArchived={showArchived}
						hasArchivedItems={hasArchivedItems}
					/>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
