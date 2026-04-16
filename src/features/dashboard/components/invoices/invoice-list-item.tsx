import { RiCheckboxCircleFill, RiExternalLinkLine } from "@remixicon/react";
import Link from "next/link";
import {
	buildInvoiceDetailsHref,
	buildInvoiceInitials,
	formatInvoicePaymentDate,
	formatInvoiceWidgetPaymentDate,
	getInvoiceShareLabel,
	parseInvoiceDueDate,
	parseInvoiceWidgetDueDate,
} from "@/features/dashboard/invoices-helpers";
import type { DashboardInvoice } from "@/features/dashboard/invoices-queries";
import MoneyValues from "@/shared/components/money-values";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/shared/components/ui/hover-card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { isDateOnlyPast } from "@/shared/utils/date";
import { InvoiceLogo } from "./invoice-logo";

type InvoiceListItemProps = {
	invoice: DashboardInvoice;
	onPay: (invoiceId: string) => void;
};

export function InvoiceListItem({ invoice, onPay }: InvoiceListItemProps) {
	const dueInfo = parseInvoiceWidgetDueDate(invoice.period, invoice.dueDay);
	const absoluteDueInfo = parseInvoiceDueDate(invoice.period, invoice.dueDay);
	const isPaid = invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID;
	const isOverdue =
		!isPaid && dueInfo.date !== null && isDateOnlyPast(dueInfo.date);
	const paymentInfo = formatInvoiceWidgetPaymentDate(invoice.paidAt);
	const absolutePaymentInfo = formatInvoicePaymentDate(invoice.paidAt);
	const breakdown = invoice.pagadorBreakdown ?? [];
	const hasBreakdown = breakdown.length > 0;
	const detailHref = buildInvoiceDetailsHref(invoice.cardId, invoice.period);
	const dueTooltipLabel =
		dueInfo.label !== absoluteDueInfo.label ? absoluteDueInfo.label : null;
	const paymentTooltipLabel =
		paymentInfo?.label && paymentInfo.label !== absolutePaymentInfo?.label
			? absolutePaymentInfo?.label
			: null;

	const linkNode = (
		<Link
			prefetch
			href={detailHref}
			className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
		>
			<span className="truncate">{invoice.cardName}</span>
			<RiExternalLinkLine
				className="size-3 shrink-0 text-muted-foreground"
				aria-hidden
			/>
		</Link>
	);

	return (
		<div className="flex items-center justify-between transition-all duration-300 py-1.5">
			<div className="flex min-w-0 flex-1 items-center gap-2 py-1">
				<InvoiceLogo
					cardName={invoice.cardName}
					logo={invoice.logo}
					size={36}
					containerClassName="size-9.5"
				/>

				<div className="min-w-0">
					{hasBreakdown ? (
						<HoverCard openDelay={150}>
							<HoverCardTrigger asChild>{linkNode}</HoverCardTrigger>
							<HoverCardContent align="start" className="w-72 space-y-3">
								<p className="text-xs text-muted-foreground">
									Distribuição por pagador
								</p>
								<ul className="space-y-2">
									{breakdown.map((share, index) => (
										<li
											key={`${invoice.id}-${
												share.payerId ?? share.pagadorName ?? index
											}`}
											className="flex items-center gap-3"
										>
											<Avatar className="size-9">
												<AvatarImage
													src={getAvatarSrc(share.pagadorAvatar)}
													alt={`Avatar de ${share.pagadorName}`}
												/>
												<AvatarFallback>
													{buildInvoiceInitials(share.pagadorName)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-foreground">
													{share.pagadorName}
												</p>
												<p className="text-xs text-muted-foreground">
													{getInvoiceShareLabel(
														share.amount,
														Math.abs(invoice.totalAmount),
													)}
												</p>
											</div>
											<div className="text-sm font-medium text-foreground">
												<MoneyValues
													className="font-medium"
													amount={share.amount}
												/>
											</div>
										</li>
									))}
								</ul>
							</HoverCardContent>
						</HoverCard>
					) : (
						linkNode
					)}

					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						{!isPaid ? (
							dueTooltipLabel ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="cursor-help">{dueInfo.label}</span>
									</TooltipTrigger>
									<TooltipContent side="top">{dueTooltipLabel}</TooltipContent>
								</Tooltip>
							) : (
								<span>{dueInfo.label}</span>
							)
						) : null}
						{isPaid && paymentInfo ? (
							paymentTooltipLabel ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="cursor-help text-success font-semibold">
											{paymentInfo.label}
										</span>
									</TooltipTrigger>
									<TooltipContent side="top">
										{paymentTooltipLabel}
									</TooltipContent>
								</Tooltip>
							) : (
								<span className="text-success font-semibold">
									{paymentInfo.label}
								</span>
							)
						) : null}
					</div>
				</div>
			</div>

			<div className="flex shrink-0 flex-col items-end">
				<MoneyValues
					className="font-medium"
					amount={Math.abs(invoice.totalAmount)}
				/>
				<Button
					type="button"
					size="sm"
					variant="link"
					className="h-auto p-0 disabled:opacity-100"
					disabled={isPaid}
					onClick={() => onPay(invoice.id)}
				>
					{isPaid ? (
						<span className="flex items-center gap-1 text-success">
							<RiCheckboxCircleFill className="size-4" /> Pago
						</span>
					) : isOverdue ? (
						<span className="overdue-blink">
							<span className="overdue-blink-primary text-destructive">
								Atrasado
							</span>
							<span className="overdue-blink-secondary">Pagar</span>
						</span>
					) : (
						<span>Pagar</span>
					)}
				</Button>
			</div>
		</div>
	);
}
