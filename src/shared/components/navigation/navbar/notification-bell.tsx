"use client";

import {
	RiAlertFill,
	RiArrowRightLine,
	RiAtLine,
	RiBankCardLine,
	RiBarChart2Line,
	RiCheckboxCircleFill,
	RiErrorWarningLine,
	RiFileListLine,
	RiNotification2Line,
	RiTimeLine,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type {
	BudgetNotification,
	DashboardNotification,
} from "@/features/dashboard/notifications-queries";
import { Badge } from "@/shared/components/ui/badge";
import { buttonVariants } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/shared/components/ui/empty";
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

type NotificationBellProps = {
	notifications: DashboardNotification[];
	totalCount: number;
	budgetNotifications: BudgetNotification[];
	preLancamentosCount?: number;
};

function formatDate(dateString: string): string {
	return (
		formatDateOnly(dateString, {
			day: "2-digit",
			month: "short",
		}) ?? dateString
	);
}

function SectionLabel({
	icon,
	title,
}: {
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
			<span className="text-muted-foreground">{icon}</span>
			<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
				{title}
			</span>
		</div>
	);
}

type NotificationItemProps = {
	href: string;
	icon: React.ReactNode;
	isOverdue: boolean;
	title: string;
	detail: string;
	onClose: () => void;
};

function NotificationItem({
	href,
	icon,
	isOverdue,
	title,
	detail,
	onClose,
}: NotificationItemProps) {
	return (
		<Link
			href={href}
			onClick={onClose}
			className={cn(
				"group mx-1 mb-0.5 flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-accent/60",
				isOverdue && "bg-destructive/5 hover:bg-destructive/10",
			)}
		>
			<span className="mt-0.5 shrink-0">{icon}</span>
			<span className="flex flex-1 flex-col gap-0.5 min-w-0">
				<span
					className={cn(
						"text-[12px] font-medium leading-snug",
						isOverdue ? "text-destructive" : "text-foreground",
					)}
				>
					{title}
				</span>
				<span className="text-[11px] leading-snug text-muted-foreground">
					{detail}
				</span>
			</span>
			<RiArrowRightLine className="mt-0.5 size-3 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}

export function NotificationBell({
	notifications,
	totalCount,
	budgetNotifications,
	preLancamentosCount = 0,
}: NotificationBellProps) {
	const [open, setOpen] = useState(false);

	const effectiveTotalCount =
		totalCount + preLancamentosCount + budgetNotifications.length;
	const displayCount =
		effectiveTotalCount > 99 ? "99+" : effectiveTotalCount.toString();
	const hasNotifications = effectiveTotalCount > 0;

	const invoiceNotifications = notifications.filter(
		(n) => n.type === "invoice",
	);
	const boletoNotifications = notifications.filter((n) => n.type === "boleto");

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							aria-label="Notificações"
							aria-expanded={open}
							className={cn(
								buttonVariants({ variant: "ghost", size: "icon-sm" }),
								"group relative shadow-none transition-all duration-200",
								"hover:border-black/20 hover:bg-black/10 hover:text-black focus-visible:ring-2 focus-visible:ring-black/20",
								"data-[state=open]:bg-black/10 data-[state=open]:text-black",
								hasNotifications ? "text-black" : "text-black/75",
							)}
						>
							<RiNotification2Line
								className={cn(
									"size-4 transition-transform duration-200",
									open ? "scale-90" : "scale-100",
								)}
							/>
							{hasNotifications && (
								<>
									<span
										aria-hidden
										className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[12px] font-semibold text-destructive-foreground"
									>
										{displayCount}
									</span>
									<span className="absolute -right-1.5 -top-1.5 size-5 animate-ping rounded-full bg-destructive/40" />
								</>
							)}
						</button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent side="bottom" sideOffset={8}>
					Notificações
				</TooltipContent>
			</Tooltip>

			<DropdownMenuContent
				align="end"
				sideOffset={12}
				className="w-80 overflow-hidden rounded-lg border border-border/60 bg-popover p-0 shadow-none"
			>
				{/* Header */}
				<DropdownMenuLabel className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5 text-[12px] font-semibold">
					<span>Notificações</span>
					{hasNotifications && (
						<Badge variant="outline" className="text-[10px] font-semibold">
							{effectiveTotalCount}{" "}
							{effectiveTotalCount === 1 ? "item" : "itens"}
						</Badge>
					)}
				</DropdownMenuLabel>

				{!hasNotifications ? (
					<div className="px-4 py-8">
						<Empty>
							<EmptyMedia>
								<RiCheckboxCircleFill color="green" />
							</EmptyMedia>
							<EmptyTitle>Nenhuma notificação</EmptyTitle>
							<EmptyDescription>
								Você está em dia com seus pagamentos!
							</EmptyDescription>
						</Empty>
					</div>
				) : (
					<div className="max-h-[460px] overflow-y-auto pb-2">
						{/* Pré-lançamentos */}
						{preLancamentosCount > 0 && (
							<div>
								<SectionLabel
									icon={<RiAtLine className="size-3" />}
									title="Pré-lançamentos"
								/>
								<NotificationItem
									href="/inbox"
									isOverdue={false}
									icon={<RiAtLine className="size-5 text-primary" />}
									title={
										preLancamentosCount === 1
											? "1 pré-lançamento pendente"
											: `${preLancamentosCount} pré-lançamentos pendentes`
									}
									detail="Aguardando revisão"
									onClose={() => setOpen(false)}
								/>
							</div>
						)}

						{/* Orçamentos */}
						{budgetNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiBarChart2Line className="size-3" />}
									title="Orçamentos"
								/>
								{budgetNotifications.map((n) => (
									<NotificationItem
										key={n.id}
										href="/budgets"
										isOverdue={n.status === "exceeded"}
										icon={
											n.status === "exceeded" ? (
												<RiAlertFill className="size-5 text-destructive" />
											) : (
												<RiErrorWarningLine className="size-5 text-amber-500" />
											)
										}
										title={n.categoryName}
										detail={
											n.status === "exceeded"
												? `Excedido — ${formatCurrency(n.spentAmount)} de ${formatCurrency(n.budgetAmount)} (${formatPercentage(n.usedPercentage, { maximumFractionDigits: 0, minimumFractionDigits: 0 })})`
												: `${formatPercentage(n.usedPercentage, { maximumFractionDigits: 0, minimumFractionDigits: 0 })} utilizado — ${formatCurrency(n.spentAmount)} de ${formatCurrency(n.budgetAmount)}`
										}
										onClose={() => setOpen(false)}
									/>
								))}
							</div>
						)}

						{/* Cartão de Crédito */}
						{invoiceNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiBankCardLine className="size-3" />}
									title="Cartão de Crédito"
								/>
								{invoiceNotifications.map((n) => {
									const logo = resolveLogoSrc(n.cardLogo);
									return (
										<NotificationItem
											key={n.id}
											href="/cards"
											isOverdue={n.status === "overdue"}
											icon={
												logo ? (
													<Image
														src={logo}
														alt=""
														width={20}
														height={20}
														className="size-5 rounded-full object-contain"
													/>
												) : n.status === "overdue" ? (
													<RiAlertFill className="size-5 text-destructive" />
												) : (
													<RiTimeLine className="size-5 text-amber-500" />
												)
											}
											title={n.name}
											detail={
												n.status === "overdue"
													? `Venceu em ${formatDate(n.dueDate)}${n.showAmount && n.amount > 0 ? ` — ${formatCurrency(n.amount)}` : ""}`
													: `Vence em ${formatDate(n.dueDate)}${n.showAmount && n.amount > 0 ? ` — ${formatCurrency(n.amount)}` : ""}`
											}
											onClose={() => setOpen(false)}
										/>
									);
								})}
							</div>
						)}

						{/* Boletos */}
						{boletoNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiFileListLine className="size-3" />}
									title="Boletos"
								/>
								{boletoNotifications.map((n) => (
									<NotificationItem
										key={n.id}
										href="/transactions"
										isOverdue={n.status === "overdue"}
										icon={
											<RiAlertFill
												className={cn(
													"size-5",
													n.status === "overdue"
														? "text-destructive"
														: "text-amber-500",
												)}
											/>
										}
										title={n.name}
										detail={
											n.status === "overdue"
												? `Venceu em ${formatDate(n.dueDate)}${n.amount > 0 ? ` — ${formatCurrency(n.amount)}` : ""}`
												: `Vence em ${formatDate(n.dueDate)}${n.amount > 0 ? ` — ${formatCurrency(n.amount)}` : ""}`
										}
										onClose={() => setOpen(false)}
									/>
								))}
							</div>
						)}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
