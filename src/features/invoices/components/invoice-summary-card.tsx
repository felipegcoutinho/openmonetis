"use client";

import { RiEditLine } from "@remixicon/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	updateInvoicePaymentStatusAction,
	updatePaymentDateAction,
} from "@/features/invoices/actions";
import MoneyValues from "@/shared/components/money-values";
import StatusDot from "@/shared/components/status-dot";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { resolveCardBrandAsset } from "@/shared/lib/cards/brand-assets";
import {
	INVOICE_PAYMENT_STATUS,
	INVOICE_STATUS_BADGE_VARIANT,
	INVOICE_STATUS_DESCRIPTION,
	INVOICE_STATUS_LABEL,
	type InvoicePaymentStatus,
} from "@/shared/lib/invoices";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateOnly } from "@/shared/utils/date";
import { cn } from "@/shared/utils/ui";
import { EditPaymentDateDialog } from "./edit-payment-date-dialog";

type InvoiceSummaryCardProps = {
	cardId: string;
	period: string;
	cardName: string;
	cardBrand: string | null;
	cardStatus: string | null;
	closingDay: string;
	dueDay: string;
	periodLabel: string;
	totalAmount: number;
	limitAmount: number | null;
	invoiceStatus: InvoicePaymentStatus;
	paymentDate: Date | null;
	logo?: string | null;
	actions?: React.ReactNode;
};

const actionLabelByStatus: Record<InvoicePaymentStatus, string> = {
	[INVOICE_PAYMENT_STATUS.PENDING]: "Marcar como paga",
	[INVOICE_PAYMENT_STATUS.PAID]: "Desfazer pagamento",
};

const actionVariantByStatus: Record<
	InvoicePaymentStatus,
	"default" | "outline"
> = {
	[INVOICE_PAYMENT_STATUS.PENDING]: "default",
	[INVOICE_PAYMENT_STATUS.PAID]: "outline",
};

const formatDay = (value: string) => value.padStart(2, "0");

const getCardStatusDotColor = (status: string | null) => {
	if (!status) return "bg-gray-400";
	const s = status.toLowerCase();
	return s === "ativo" || s === "active" ? "bg-success" : "bg-gray-400";
};

const formatPaymentDate = (value: Date | null) =>
	formatDateOnly(value, {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}) ?? "data não informada";

export function InvoiceSummaryCard({
	cardId,
	period,
	cardName,
	cardBrand,
	cardStatus,
	closingDay,
	dueDay,
	periodLabel,
	totalAmount,
	limitAmount,
	invoiceStatus,
	paymentDate: initialPaymentDate,
	logo,
	actions,
}: InvoiceSummaryCardProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [paymentDate, setPaymentDate] = useState<Date>(
		initialPaymentDate ?? new Date(),
	);

	useEffect(() => {
		setPaymentDate(initialPaymentDate ?? new Date());
	}, [initialPaymentDate]);

	const logoPath = resolveLogoSrc(logo);
	const brandAsset = resolveCardBrandAsset(cardBrand);
	const isPaid = invoiceStatus === INVOICE_PAYMENT_STATUS.PAID;
	const paymentDateLabel = isPaid ? formatPaymentDate(paymentDate) : null;
	const actionDescription = isPaid
		? `Pagamento registrado em ${paymentDateLabel}.`
		: INVOICE_STATUS_DESCRIPTION[invoiceStatus];

	const targetStatus = isPaid
		? INVOICE_PAYMENT_STATUS.PENDING
		: INVOICE_PAYMENT_STATUS.PAID;

	const handleAction = () => {
		startTransition(async () => {
			const result = await updateInvoicePaymentStatusAction({
				cardId,
				period,
				status: targetStatus,
				paymentDate:
					targetStatus === INVOICE_PAYMENT_STATUS.PAID
						? paymentDate.toISOString().split("T")[0]
						: undefined,
			});

			if (result.success) {
				toast.success(result.message);
				router.refresh();
				return;
			}

			toast.error(result.error);
		});
	};

	const handleDateChange = (newDate: Date) => {
		setPaymentDate(newDate);
		startTransition(async () => {
			const result = await updatePaymentDateAction({
				cardId,
				period,
				paymentDate: newDate.toISOString().split("T")[0] ?? "",
			});

			if (result.success) {
				toast.success(result.message);
				router.refresh();
				return;
			}

			toast.error(result.error);
		});
	};

	return (
		<Card className="gap-0 py-0">
			<CardContent className="px-4 py-4 sm:px-5 sm:py-5">
				<div className="flex flex-col gap-4">
					{/* Linha 1 — identidade */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							{logoPath ? (
								<div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full">
									<Image
										src={logoPath}
										alt={`Logo ${cardName}`}
										width={42}
										height={42}
										className="h-full w-full object-contain"
									/>
								</div>
							) : cardBrand ? (
								<span className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium text-muted-foreground">
									{cardBrand.slice(0, 2).toUpperCase()}
								</span>
							) : null}
							<div className="min-w-0">
								<h2 className="truncate text-sm font-semibold text-foreground">
									{cardName}
								</h2>
								<p className="text-xs text-muted-foreground">
									Fatura de {periodLabel}
								</p>
							</div>
						</div>
						{actions ? <div className="shrink-0">{actions}</div> : null}
					</div>

					{/* Linha 2 — valor da fatura (hero) */}
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">Valor da fatura</p>
						<MoneyValues
							amount={totalAmount}
							className={cn(
								"text-3xl leading-none tracking-tighter sm:text-[2rem]",
								isPaid ? "text-success" : "text-foreground",
							)}
						/>
						<div className="flex items-center gap-2">
							<Badge
								variant={INVOICE_STATUS_BADGE_VARIANT[invoiceStatus]}
								className="text-xs"
							>
								{INVOICE_STATUS_LABEL[invoiceStatus]}
							</Badge>
							{cardStatus ? (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<StatusDot color={getCardStatusDotColor(cardStatus)} />
									<span>{cardStatus}</span>
								</div>
							) : null}
						</div>
					</div>

					{/* Linha 3 — metadados do cartão */}
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<MetaItem label="Vencimento">
							<span className="text-sm font-medium text-foreground">
								Dia {formatDay(dueDay)}
							</span>
						</MetaItem>

						<MetaItem label="Fechamento">
							<span className="text-sm font-medium text-foreground">
								Dia {formatDay(closingDay)}
							</span>
						</MetaItem>

						{typeof limitAmount === "number" ? (
							<MetaItem label="Limite">
								<span className="text-sm font-medium text-foreground">
									{formatCurrency(limitAmount)}
								</span>
							</MetaItem>
						) : null}

						{cardBrand ? (
							<MetaItem label="Bandeira">
								<div className="flex items-center gap-1.5">
									{brandAsset ? (
										<Image
											src={brandAsset}
											alt={cardBrand}
											width={24}
											height={24}
											className="h-4 w-auto shrink-0"
										/>
									) : null}
									<span className="text-sm font-medium text-foreground truncate">
										{cardBrand}
									</span>
								</div>
							</MetaItem>
						) : null}
					</div>

					{/* Linha 4 — ação */}
					<div className="flex flex-col gap-3 rounded-md border border-dashed bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground">
								{actionDescription}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<Button
								type="button"
								size="sm"
								variant={actionVariantByStatus[invoiceStatus]}
								disabled={isPending}
								onClick={handleAction}
								className="min-w-32"
							>
								{isPending ? "Salvando..." : actionLabelByStatus[invoiceStatus]}
							</Button>
							{isPaid ? (
								<EditPaymentDateDialog
									trigger={
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="text-muted-foreground hover:text-foreground"
											aria-label="Editar data de pagamento"
										>
											<RiEditLine className="size-4" />
										</Button>
									}
									currentDate={paymentDate}
									onDateChange={handleDateChange}
								/>
							) : null}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="rounded-md border border-border/60 px-3 py-2">
			<span className="block text-sm font-medium text-muted-foreground">
				{label}
			</span>
			<div className="mt-1">{children}</div>
		</div>
	);
}
