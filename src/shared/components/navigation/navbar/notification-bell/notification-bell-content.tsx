"use client";

import {
	RiAlertFill,
	RiArchiveLine,
	RiArrowGoBackLine,
	RiAtLine,
	RiBankCardLine,
	RiBarChart2Line,
	RiCheckLine,
	RiErrorWarningLine,
	RiFileListLine,
	RiInboxUnarchiveLine,
	RiTimeLine,
} from "@remixicon/react";
import Image from "next/image";
import StatusDot from "@/shared/components/status-dot";
import { buttonVariants } from "@/shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateOnly } from "@/shared/utils/date";
import { formatPercentage } from "@/shared/utils/percentage";
import { cn } from "@/shared/utils/ui";
import type {
	ResolvedBudgetNotification,
	ResolvedDashboardNotification,
	StatefulNotification,
} from "./types";

type NotificationBellContentProps = {
	displayedPreLancamentosCount: number;
	displayedBudgetNotifications: ResolvedBudgetNotification[];
	invoiceNotifications: ResolvedDashboardNotification[];
	boletoNotifications: ResolvedDashboardNotification[];
	onInboxNavigate: () => void;
	onNotificationNavigate: (notification: StatefulNotification) => Promise<void>;
	onToggleRead: (notification: StatefulNotification) => Promise<void>;
	onToggleArchive: (notification: StatefulNotification) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
	return (
		formatDateOnly(dateString, { day: "2-digit", month: "short" }) ?? dateString
	);
}

function getReadAction(notification: StatefulNotification) {
	return {
		label: notification.isRead ? "Marcar como não lida" : "Marcar como lida",
		icon: notification.isRead ? (
			<RiArrowGoBackLine className="size-4" />
		) : (
			<RiCheckLine className="size-4" />
		),
	};
}

function getArchiveAction(notification: StatefulNotification) {
	return {
		label: notification.isArchived
			? "Desarquivar notificação"
			: "Arquivar notificação",
		icon: notification.isArchived ? (
			<RiInboxUnarchiveLine className="size-4" />
		) : (
			<RiArchiveLine className="size-4" />
		),
	};
}

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------

function SectionLabel({
	icon,
	title,
}: {
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<div className="flex items-center gap-1.5 p-2 first:pt-1">
			<span className="text-muted-foreground">{icon}</span>
			<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
				{title}
			</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

function NotificationActionButton({
	label,
	icon,
	onClick,
	disabled = false,
}: {
	label: string;
	icon: React.ReactNode;
	onClick?: () => void | Promise<void>;
	disabled?: boolean;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={() => {
						void onClick?.();
					}}
					disabled={disabled}
					aria-label={label}
					className={cn(
						buttonVariants({ variant: "ghost", size: "icon-sm" }),
						"size-7 text-muted-foreground opacity-0 transition-all group-hover/item:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 disabled:opacity-50",
					)}
				>
					{icon}
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom" sideOffset={8}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

type NotificationItemProps = {
	icon: React.ReactNode;
	isOverdue: boolean;
	isRead?: boolean;
	isArchived?: boolean;
	isBusy?: boolean;
	showUnreadIndicator?: boolean;
	title: string;
	detail: string;
	onNavigate: () => void | Promise<void>;
	onToggleRead?: () => void | Promise<void>;
	onToggleArchive?: () => void | Promise<void>;
	notification?: StatefulNotification;
};

function NotificationItem({
	icon,
	isOverdue,
	isRead = false,
	isArchived = false,
	isBusy = false,
	showUnreadIndicator = false,
	title,
	detail,
	onNavigate,
	onToggleRead,
	onToggleArchive,
	notification,
}: NotificationItemProps) {
	const readAction = notification ? getReadAction(notification) : null;
	const archiveAction = notification ? getArchiveAction(notification) : null;

	return (
		<div
			className={cn(
				"group/item mx-1 mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors",
				isArchived
					? "opacity-60"
					: isOverdue && !isRead
						? "bg-destructive/5"
						: "hover:bg-accent/50",
			)}
		>
			<button
				type="button"
				onClick={() => {
					void onNavigate();
				}}
				disabled={isBusy}
				className="flex min-w-0 flex-1 items-start gap-2.5 text-left disabled:cursor-wait disabled:opacity-80"
			>
				<span className="mt-0.5 shrink-0">{icon}</span>
				<span className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="flex min-w-0 items-center gap-1.5">
						<span
							className={cn(
								"min-w-0 truncate text-xs font-medium leading-snug",
								isOverdue && !isRead
									? "text-destructive"
									: isRead
										? "text-muted-foreground"
										: "text-foreground",
							)}
						>
							{title}
						</span>
						{showUnreadIndicator && !isRead && (
							<StatusDot color="bg-destructive/80" className="size-1.5" />
						)}
					</span>
					<span
						className={cn(
							"text-xs leading-snug",
							isRead ? "text-muted-foreground/70" : "text-muted-foreground",
						)}
					>
						{detail}
					</span>
				</span>
			</button>

			{(readAction || archiveAction) && (
				<div className="flex w-16 shrink-0 items-center justify-end gap-0.5">
					{readAction && onToggleRead && (
						<NotificationActionButton
							label={readAction.label}
							icon={readAction.icon}
							onClick={onToggleRead}
							disabled={isBusy}
						/>
					)}
					{archiveAction && onToggleArchive && (
						<NotificationActionButton
							label={archiveAction.label}
							icon={archiveAction.icon}
							onClick={onToggleArchive}
							disabled={isBusy}
						/>
					)}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// NotificationSection — generic wrapper to eliminate per-type repetition
// ---------------------------------------------------------------------------

type NotificationSectionProps<
	T extends StatefulNotification & { isBusy: boolean },
> = {
	icon: React.ReactNode;
	title: string;
	items: T[];
	renderIcon: (item: T) => React.ReactNode;
	renderTitle: (item: T) => string;
	renderDetail: (item: T) => string;
	isOverdue: (item: T) => boolean;
	showUnreadIndicator?: boolean;
	onNavigate: (item: T) => void | Promise<void>;
	onToggleRead: (item: T) => void | Promise<void>;
	onToggleArchive: (item: T) => void | Promise<void>;
};

function NotificationSection<
	T extends StatefulNotification & { isBusy: boolean },
>({
	icon,
	title,
	items,
	renderIcon,
	renderTitle,
	renderDetail,
	isOverdue,
	showUnreadIndicator = false,
	onNavigate,
	onToggleRead,
	onToggleArchive,
}: NotificationSectionProps<T>) {
	if (items.length === 0) return null;

	return (
		<div>
			<SectionLabel icon={icon} title={title} />
			{items.map((item) => (
				<NotificationItem
					key={item.notificationKey}
					isOverdue={isOverdue(item)}
					isRead={item.isRead}
					isArchived={item.isArchived}
					isBusy={item.isBusy}
					showUnreadIndicator={showUnreadIndicator}
					icon={renderIcon(item)}
					title={renderTitle(item)}
					detail={renderDetail(item)}
					onNavigate={() => onNavigate(item)}
					onToggleRead={() => onToggleRead(item)}
					onToggleArchive={() => onToggleArchive(item)}
					notification={item}
				/>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Icon helpers (consistent between invoice / boleto)
// ---------------------------------------------------------------------------

function DueDateIcon({ isOverdue }: { isOverdue: boolean }) {
	return isOverdue ? (
		<RiAlertFill className="size-5 text-destructive" />
	) : (
		<RiTimeLine className="size-5 text-amber-500" />
	);
}

function InvoiceIcon({
	cardLogo,
	isOverdue,
}: {
	cardLogo?: string | null;
	isOverdue: boolean;
}) {
	const logo = resolveLogoSrc(cardLogo);

	if (logo) {
		return (
			<Image
				src={logo}
				alt=""
				width={20}
				height={20}
				className="size-5 rounded-full object-contain"
			/>
		);
	}

	return <DueDateIcon isOverdue={isOverdue} />;
}

function formatDueDateDetail(
	status: string,
	dueDate: string,
	amount: number,
	showAmount: boolean,
) {
	const verb = status === "overdue" ? "Venceu em" : "Vence em";
	const amountStr =
		showAmount && amount > 0 ? ` — ${formatCurrency(amount)}` : "";
	return `${verb} ${formatDate(dueDate)}${amountStr}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function NotificationBellContent({
	displayedPreLancamentosCount,
	displayedBudgetNotifications,
	invoiceNotifications,
	boletoNotifications,
	onInboxNavigate,
	onNotificationNavigate,
	onToggleRead,
	onToggleArchive,
}: NotificationBellContentProps) {
	return (
		<div className="max-h-[460px] overflow-y-auto p-2">
			{displayedPreLancamentosCount > 0 && (
				<div>
					<SectionLabel
						icon={<RiAtLine className="size-3" />}
						title="Pré-lançamentos"
					/>
					<NotificationItem
						icon={<RiAtLine className="size-5 text-primary" />}
						isOverdue={false}
						title={
							displayedPreLancamentosCount === 1
								? "1 pré-lançamento pendente"
								: `${displayedPreLancamentosCount} pré-lançamentos pendentes`
						}
						detail="Aguardando revisão"
						onNavigate={onInboxNavigate}
					/>
				</div>
			)}

			<NotificationSection
				icon={<RiBarChart2Line className="size-3" />}
				title="Orçamentos"
				items={displayedBudgetNotifications}
				isOverdue={(n) => n.status === "exceeded"}
				showUnreadIndicator
				renderIcon={(n) =>
					n.status === "exceeded" ? (
						<RiAlertFill className="size-5 text-destructive" />
					) : (
						<RiErrorWarningLine className="size-5 text-amber-500" />
					)
				}
				renderTitle={(n) => n.categoryName}
				renderDetail={(n) =>
					n.status === "exceeded"
						? `Excedido — ${formatCurrency(n.spentAmount)} de ${formatCurrency(n.budgetAmount)} (${formatPercentage(n.usedPercentage, { maximumFractionDigits: 0, minimumFractionDigits: 0 })})`
						: `${formatPercentage(n.usedPercentage, { maximumFractionDigits: 0, minimumFractionDigits: 0 })} utilizado — ${formatCurrency(n.spentAmount)} de ${formatCurrency(n.budgetAmount)}`
				}
				onNavigate={(n) => onNotificationNavigate(n)}
				onToggleRead={(n) => onToggleRead(n)}
				onToggleArchive={(n) => onToggleArchive(n)}
			/>

			<NotificationSection
				icon={<RiBankCardLine className="size-3" />}
				title="Cartão de Crédito"
				items={invoiceNotifications}
				isOverdue={(n) => n.status === "overdue"}
				showUnreadIndicator
				renderIcon={(n) => (
					<InvoiceIcon
						cardLogo={n.cardLogo}
						isOverdue={n.status === "overdue"}
					/>
				)}
				renderTitle={(n) => n.name}
				renderDetail={(n) =>
					formatDueDateDetail(n.status, n.dueDate, n.amount, n.showAmount)
				}
				onNavigate={(n) => onNotificationNavigate(n)}
				onToggleRead={(n) => onToggleRead(n)}
				onToggleArchive={(n) => onToggleArchive(n)}
			/>

			<NotificationSection
				icon={<RiFileListLine className="size-3" />}
				title="Boletos"
				items={boletoNotifications}
				isOverdue={(n) => n.status === "overdue"}
				showUnreadIndicator
				renderIcon={(n) => <DueDateIcon isOverdue={n.status === "overdue"} />}
				renderTitle={(n) => n.name}
				renderDetail={(n) =>
					formatDueDateDetail(n.status, n.dueDate, n.amount, true)
				}
				onNavigate={(n) => onNotificationNavigate(n)}
				onToggleRead={(n) => onToggleRead(n)}
				onToggleArchive={(n) => onToggleArchive(n)}
			/>
		</div>
	);
}
