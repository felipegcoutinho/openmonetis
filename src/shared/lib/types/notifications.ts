export type NotificationType = "overdue" | "due_soon";

export type BudgetStatus = "exceeded" | "critical";

export type DashboardNotificationStateFields = {
	notificationKey: string;
	fingerprint: string;
	href: string;
	isRead: boolean;
	isArchived: boolean;
	readAt: Date | null;
	archivedAt: Date | null;
};

export type DashboardNotification = {
	type: "invoice" | "boleto";
	name: string;
	dueDate: string;
	status: NotificationType;
	amount: number;
	period?: string;
	showAmount: boolean;
	cardLogo?: string | null;
} & DashboardNotificationStateFields;

export type BudgetNotification = {
	categoryName: string;
	budgetAmount: number;
	spentAmount: number;
	usedPercentage: number;
	status: BudgetStatus;
} & DashboardNotificationStateFields;

export type DashboardNotificationsSnapshot = {
	notifications: DashboardNotification[];
	budgetNotifications: BudgetNotification[];
	unreadCount: number;
	visibleCount: number;
};
