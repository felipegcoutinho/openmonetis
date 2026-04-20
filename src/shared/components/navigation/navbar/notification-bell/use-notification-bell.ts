"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	archiveDashboardNotificationAction,
	markDashboardNotificationAsReadAction,
	markDashboardNotificationAsUnreadAction,
	unarchiveDashboardNotificationAction,
} from "@/features/dashboard/notifications/notifications-actions";
import type {
	NotificationActionState,
	NotificationBellProps,
	NotificationViewMode,
	ResolvedBudgetNotification,
	ResolvedDashboardNotification,
	StatefulNotification,
} from "./types";

type NotificationAction = "read" | "unread" | "archive" | "unarchive";

type UseNotificationBellReturn = {
	open: boolean;
	setOpen: (open: boolean) => void;
	viewMode: NotificationViewMode;
	setViewMode: (viewMode: NotificationViewMode) => void;
	displayCount: string;
	hasUnreadNotifications: boolean;
	hasAnySourceItems: boolean;
	headerCountLabel: string;
	hasDashboardNotificationItems: boolean;
	hasArchivedItems: boolean;
	archivedDashboardCount: number;
	hasVisibleItems: boolean;
	displayedPreLancamentosCount: number;
	displayedBudgetNotifications: ResolvedBudgetNotification[];
	invoiceNotifications: ResolvedDashboardNotification[];
	boletoNotifications: ResolvedDashboardNotification[];
	handleInboxNavigate: () => void;
	handleNotificationNavigate: (
		notification: StatefulNotification,
	) => Promise<void>;
	handleToggleRead: (notification: StatefulNotification) => Promise<void>;
	handleToggleArchive: (notification: StatefulNotification) => Promise<void>;
	showArchived: boolean;
};

const optimisticStateByAction: Record<
	NotificationAction,
	(notification: StatefulNotification) => NotificationActionState
> = {
	archive: () => ({ isRead: true, isArchived: true, isBusy: true }),
	unarchive: () => ({ isRead: true, isArchived: false, isBusy: true }),
	read: (n) => ({
		isRead: true,
		isArchived: n.isArchived,
		isBusy: true,
	}),
	unread: (n) => ({
		isRead: false,
		isArchived: n.isArchived,
		isBusy: true,
	}),
};

const serverActionByType: Record<
	NotificationAction,
	(input: {
		notificationKey: string;
		fingerprint: string;
	}) => Promise<{ success: boolean; message?: string; error?: string }>
> = {
	archive: archiveDashboardNotificationAction,
	unarchive: unarchiveDashboardNotificationAction,
	read: markDashboardNotificationAsReadAction,
	unread: markDashboardNotificationAsUnreadAction,
};

export function useNotificationBell({
	notifications,
	unreadCount: initialUnreadCount,
	visibleCount: initialVisibleCount,
	budgetNotifications,
	preLancamentosCount = 0,
}: NotificationBellProps): UseNotificationBellReturn {
	const [open, setOpen] = useState(false);
	const [viewMode, setViewMode] = useState<NotificationViewMode>("active");
	const [notificationActions, setNotificationActions] = useState<
		Record<string, NotificationActionState>
	>({});
	const router = useRouter();
	const showArchived = viewMode === "archived";

	// Limpar estado otimista quando o server retorna dados novos (via router.refresh)
	const prevNotificationsRef = useRef(notifications);
	const prevBudgetRef = useRef(budgetNotifications);

	useEffect(() => {
		if (
			prevNotificationsRef.current !== notifications ||
			prevBudgetRef.current !== budgetNotifications
		) {
			prevNotificationsRef.current = notifications;
			prevBudgetRef.current = budgetNotifications;
			setNotificationActions({});
		}
	}, [notifications, budgetNotifications]);

	const resolveNotificationState = <T extends StatefulNotification>(
		notification: T,
	): T & { isBusy: boolean } => {
		const actionState = notificationActions[notification.notificationKey];

		if (!actionState) {
			return { ...notification, isBusy: false };
		}

		return {
			...notification,
			isRead: actionState.isRead,
			isArchived: actionState.isArchived,
			isBusy: actionState.isBusy,
		};
	};

	const allResolvedNotifications = notifications.map((notification) =>
		resolveNotificationState(notification),
	);
	const allResolvedBudgetNotifications = budgetNotifications.map(
		(notification) => resolveNotificationState(notification),
	);
	const activeNotifications = allResolvedNotifications.filter(
		(notification) => !notification.isArchived,
	);
	const activeBudgetNotifications = allResolvedBudgetNotifications.filter(
		(notification) => !notification.isArchived,
	);
	const archivedNotifications = allResolvedNotifications.filter(
		(notification) => notification.isArchived,
	);
	const archivedBudgetNotifications = allResolvedBudgetNotifications.filter(
		(notification) => notification.isArchived,
	);
	const displayedNotifications = showArchived
		? archivedNotifications
		: activeNotifications;
	const displayedBudgetNotifications = showArchived
		? archivedBudgetNotifications
		: activeBudgetNotifications;
	const invoiceNotifications = displayedNotifications.filter(
		(notification) => notification.type === "invoice",
	);
	const boletoNotifications = displayedNotifications.filter(
		(notification) => notification.type === "boleto",
	);
	const unreadDashboardCount = [
		...activeNotifications,
		...activeBudgetNotifications,
	].filter((notification) => !notification.isRead).length;
	const activeDashboardCountFromItems =
		activeNotifications.length + activeBudgetNotifications.length;
	const displayedDashboardCountFromItems =
		displayedNotifications.length + displayedBudgetNotifications.length;
	const archivedDashboardCount =
		allResolvedNotifications.length +
		allResolvedBudgetNotifications.length -
		activeDashboardCountFromItems;
	const dashboardNotificationCount =
		allResolvedNotifications.length + allResolvedBudgetNotifications.length;
	const hasOptimisticState = Object.keys(notificationActions).length > 0;
	const unreadDashboardCountValue = hasOptimisticState
		? unreadDashboardCount
		: initialUnreadCount;
	const activeDashboardCount = hasOptimisticState
		? activeDashboardCountFromItems
		: initialVisibleCount;
	const displayedDashboardCount = showArchived
		? displayedDashboardCountFromItems
		: activeDashboardCount;
	const displayedPreLancamentosCount = showArchived ? 0 : preLancamentosCount;
	const effectiveUnreadCount = unreadDashboardCountValue + preLancamentosCount;
	const displayCount =
		effectiveUnreadCount > 99 ? "99+" : effectiveUnreadCount.toString();
	const hasUnreadNotifications = effectiveUnreadCount > 0;
	const hasVisibleItems =
		displayedDashboardCount + displayedPreLancamentosCount > 0;
	const hasArchivedItems = archivedDashboardCount > 0;
	const hasDashboardNotificationItems = dashboardNotificationCount > 0;
	const hasAnySourceItems =
		allResolvedNotifications.length +
			allResolvedBudgetNotifications.length +
			preLancamentosCount >
		0;
	const headerCountLabel = `${effectiveUnreadCount} ${effectiveUnreadCount === 1 ? "pendente" : "pendentes"}`;

	useEffect(() => {
		if (showArchived && !hasArchivedItems) {
			setViewMode("active");
		}
	}, [hasArchivedItems, showArchived]);

	const persistNotificationState = async (
		notification: StatefulNotification,
		action: NotificationAction,
		options?: { showToast?: boolean; refreshAfter?: boolean },
	): Promise<boolean> => {
		const showToast = options?.showToast ?? true;
		const refreshAfter = options?.refreshAfter ?? true;

		const previousState: NotificationActionState = {
			isRead: notification.isRead,
			isArchived: notification.isArchived,
			isBusy: false,
		};

		const optimisticState = optimisticStateByAction[action](notification);

		setNotificationActions((current) => ({
			...current,
			[notification.notificationKey]: optimisticState,
		}));

		const result = await serverActionByType[action]({
			notificationKey: notification.notificationKey,
			fingerprint: notification.fingerprint,
		});

		if (!result.success) {
			setNotificationActions((current) => ({
				...current,
				[notification.notificationKey]: previousState,
			}));

			if (showToast) {
				toast.error(result.error);
			}

			return false;
		}

		setNotificationActions((current) => ({
			...current,
			[notification.notificationKey]: {
				isRead: optimisticState.isRead,
				isArchived: optimisticState.isArchived,
				isBusy: false,
			},
		}));

		if (showToast) {
			toast.success(result.message);
		}

		if (refreshAfter) {
			router.refresh();
		}

		return true;
	};

	const handleInboxNavigate = () => {
		setOpen(false);
		router.push("/inbox");
	};

	const handleNotificationNavigate = async (
		notification: StatefulNotification,
	) => {
		setOpen(false);

		if (!notification.isRead) {
			await persistNotificationState(notification, "read", {
				showToast: false,
				refreshAfter: false,
			});
		}

		router.push(notification.href);
	};

	const handleToggleRead = async (notification: StatefulNotification) => {
		await persistNotificationState(
			notification,
			notification.isRead ? "unread" : "read",
		);
	};

	const handleToggleArchive = async (notification: StatefulNotification) => {
		await persistNotificationState(
			notification,
			notification.isArchived ? "unarchive" : "archive",
		);
	};

	return {
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
	};
}
