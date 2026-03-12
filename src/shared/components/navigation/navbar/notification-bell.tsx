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
	RiNotification3Line,
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
			<span className="text-xs text-muted-foreground">{title}</span>
		</div>
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
								"group relative border border-black/10 text-black/75 shadow-none transition-all duration-200",
								"hover:border-black/20 hover:bg-black/10 hover:text-black focus-visible:ring-2 focus-visible:ring-black/20",
								"data-[state=open]:bg-black/10 data-[state=open]:text-black",
							)}
						>
							<RiNotification3Line
								className={cn(
									"size-4 transition-transform duration-200",
									open ? "scale-90" : "scale-100",
								)}
							/>
							{hasNotifications && (
								<>
									<span
										aria-hidden
										className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground "
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
				className="w-76 overflow-hidden rounded-lg border border-border/60 bg-popover p-0 shadow-none"
			>
				{/* Header */}
				<DropdownMenuLabel className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5 text-sm font-semibold">
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
								<Link
									href="/inbox"
									onClick={() => setOpen(false)}
									className="group mx-1 mb-1 flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-accent/60"
								>
									<RiAtLine className="size-6 shrink-0 text-primary" />
									<p className="flex-1 text-xs leading-snug text-foreground">
										{preLancamentosCount === 1
											? "1 pré-lançamento aguardando revisão"
											: `${preLancamentosCount} pré-lançamentos aguardando revisão`}
									</p>
									<RiArrowRightLine className="size-3 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
								</Link>
							</div>
						)}

						{/* Orçamentos */}
						{budgetNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiBarChart2Line className="size-3" />}
									title="Orçamentos"
								/>
								<div className="mx-1 mb-1 overflow-hidden rounded-md">
									{budgetNotifications.map((n) => (
										<div
											key={n.id}
											className="flex items-start gap-2 px-2 py-2"
										>
											{n.status === "exceeded" ? (
												<RiAlertFill className="mt-0.5 size-6 shrink-0 text-destructive" />
											) : (
												<RiErrorWarningLine className="mt-0.5 size-6 shrink-0 text-amber-500" />
											)}
											<p className="text-xs leading-snug">
												{n.status === "exceeded" ? (
													<>
														Orçamento de <strong>{n.categoryName}</strong>{" "}
														excedido —{" "}
														<strong>{formatCurrency(n.spentAmount)}</strong> de{" "}
														{formatCurrency(n.budgetAmount)} (
														{formatPercentage(n.usedPercentage, {
															maximumFractionDigits: 0,
															minimumFractionDigits: 0,
														})}
														)
													</>
												) : (
													<>
														<strong>{n.categoryName}</strong> atingiu{" "}
														<strong>
															{formatPercentage(n.usedPercentage, {
																maximumFractionDigits: 0,
																minimumFractionDigits: 0,
															})}
														</strong>{" "}
														do orçamento —{" "}
														<strong>{formatCurrency(n.spentAmount)}</strong> de{" "}
														{formatCurrency(n.budgetAmount)}
													</>
												)}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Cartão de Crédito */}
						{invoiceNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiBankCardLine className="size-3" />}
									title="Cartão de Crédito"
								/>
								<div className="mx-1 mb-1 overflow-hidden rounded-md">
									{invoiceNotifications.map((n) => {
										const logo = resolveLogoSrc(n.cardLogo);
										return (
											<div
												key={n.id}
												className="flex items-start gap-2 px-2 py-2"
											>
												{logo ? (
													<Image
														src={logo}
														alt=""
														width={24}
														height={24}
														className="mt-0.5 size-6 shrink-0 rounded-sm object-contain"
													/>
												) : n.status === "overdue" ? (
													<RiAlertFill className="mt-0.5 size-3.5 shrink-0 text-destructive" />
												) : (
													<RiTimeLine className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
												)}
												<p className="text-xs leading-snug">
													{n.status === "overdue" ? (
														<>
															A fatura de <strong>{n.name}</strong> venceu em{" "}
															{formatDate(n.dueDate)}
															{n.showAmount && n.amount > 0 && (
																<>
																	{" "}
																	— <strong>{formatCurrency(n.amount)}</strong>
																</>
															)}
														</>
													) : (
														<>
															A fatura de <strong>{n.name}</strong> vence em{" "}
															{formatDate(n.dueDate)}
															{n.showAmount && n.amount > 0 && (
																<>
																	{" "}
																	— <strong>{formatCurrency(n.amount)}</strong>
																</>
															)}
														</>
													)}
												</p>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Boletos */}
						{boletoNotifications.length > 0 && (
							<div>
								<SectionLabel
									icon={<RiFileListLine className="size-3" />}
									title="Boletos"
								/>
								<div className="mx-1 mb-1 overflow-hidden rounded-md">
									{boletoNotifications.map((n) => (
										<div
											key={n.id}
											className="flex items-start gap-2 px-2 py-2"
										>
											<RiAlertFill
												className={cn(
													"mt-0.5 size-6 shrink-0",
													n.status === "overdue"
														? "text-destructive"
														: "text-amber-500",
												)}
											/>
											<p className="text-xs leading-snug">
												{n.status === "overdue" ? (
													<>
														O boleto <strong>{n.name}</strong>
														{n.amount > 0 && (
															<>
																{" "}
																— <strong>{formatCurrency(n.amount)}</strong>
															</>
														)}{" "}
														venceu em {formatDate(n.dueDate)}
													</>
												) : (
													<>
														O boleto <strong>{n.name}</strong>
														{n.amount > 0 && (
															<>
																{" "}
																— <strong>{formatCurrency(n.amount)}</strong>
															</>
														)}{" "}
														vence em {formatDate(n.dueDate)}
													</>
												)}
											</p>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
