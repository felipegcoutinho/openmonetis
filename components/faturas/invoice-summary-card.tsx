"use client";

import { RiEditLine } from "@remixicon/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	updateInvoicePaymentStatusAction,
	updatePaymentDateAction,
} from "@/app/(dashboard)/cartoes/[cartaoId]/fatura/actions";
import DotIcon from "@/components/dot-icon";
import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	INVOICE_PAYMENT_STATUS,
	INVOICE_STATUS_BADGE_VARIANT,
	INVOICE_STATUS_DESCRIPTION,
	INVOICE_STATUS_LABEL,
	type InvoicePaymentStatus,
} from "@/lib/faturas";
import { cn } from "@/lib/utils/ui";
import { EditPaymentDateDialog } from "./edit-payment-date-dialog";

type InvoiceSummaryCardProps = {
	cartaoId: string;
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

const BRAND_ASSETS: Record<string, string> = {
	visa: "/bandeiras/visa.svg",
	mastercard: "/bandeiras/mastercard.svg",
	amex: "/bandeiras/amex.svg",
	american: "/bandeiras/amex.svg",
	elo: "/bandeiras/elo.svg",
	hipercard: "/bandeiras/hipercard.svg",
	hiper: "/bandeiras/hipercard.svg",
};

const resolveBrandAsset = (brand: string) => {
	const normalized = brand.trim().toLowerCase();

	const match = (
		Object.keys(BRAND_ASSETS) as Array<keyof typeof BRAND_ASSETS>
	).find((entry) => normalized.includes(entry));

	return match ? BRAND_ASSETS[match] : null;
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

const resolveLogoPath = (logo?: string | null) => {
	if (!logo) return null;
	if (
		logo.startsWith("http://") ||
		logo.startsWith("https://") ||
		logo.startsWith("data:")
	) {
		return logo;
	}

	return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

const getCardStatusDotColor = (status: string | null) => {
	if (!status) return "bg-gray-400";
	const normalizedStatus = status.toLowerCase();
	if (normalizedStatus === "ativo" || normalizedStatus === "active") {
		return "bg-success";
	}
	return "bg-gray-400";
};

export function InvoiceSummaryCard({
	cartaoId,
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

	// Atualizar estado quando initialPaymentDate mudar
	useEffect(() => {
		if (initialPaymentDate) {
			setPaymentDate(initialPaymentDate);
		}
	}, [initialPaymentDate]);

	const logoPath = useMemo(() => resolveLogoPath(logo), [logo]);

	const brandAsset = useMemo(
		() => (cardBrand ? resolveBrandAsset(cardBrand) : null),
		[cardBrand],
	);

	const limitLabel = useMemo(() => {
		if (typeof limitAmount !== "number") return "—";
		return limitAmount.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
			maximumFractionDigits: 2,
		});
	}, [limitAmount]);

	const targetStatus =
		invoiceStatus === INVOICE_PAYMENT_STATUS.PAID
			? INVOICE_PAYMENT_STATUS.PENDING
			: INVOICE_PAYMENT_STATUS.PAID;

	const handleAction = () => {
		startTransition(async () => {
			const result = await updateInvoicePaymentStatusAction({
				cartaoId,
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
				cartaoId,
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
		<Card className="border">
			<CardHeader className="flex flex-col gap-3">
				<div className="flex items-start gap-3">
					{logoPath ? (
						<div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-background">
							<Image
								src={logoPath}
								alt={`Logo do cartão ${cardName}`}
								width={48}
								height={48}
								className="h-full w-full object-contain"
							/>
						</div>
					) : cardBrand ? (
						<span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-sm font-semibold text-muted-foreground">
							{cardBrand}
						</span>
					) : null}

					<div className="flex w-full items-start justify-between gap-3">
						<div className="space-y-1">
							<CardTitle className="text-xl font-semibold text-foreground">
								{cardName}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Fatura de {periodLabel}
							</p>
						</div>
						{actions ? <div className="shrink-0">{actions}</div> : null}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 border-t border-border/60 border-dashed pt-4">
				{/* Destaque Principal */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<DetailItem
						label="Valor total"
						value={
							<MoneyValues
								amount={totalAmount}
								className="text-2xl text-foreground"
							/>
						}
					/>
					<DetailItem
						label="Status da fatura"
						value={
							<Badge
								variant={INVOICE_STATUS_BADGE_VARIANT[invoiceStatus]}
								className="text-xs"
							>
								{INVOICE_STATUS_LABEL[invoiceStatus]}
							</Badge>
						}
					/>
				</div>

				{/* Informações Gerais */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<DetailItem
						label="Fechamento"
						value={
							<span className="font-medium">Dia {formatDay(closingDay)}</span>
						}
					/>
					<DetailItem
						label="Vencimento"
						value={<span className="font-medium">Dia {formatDay(dueDay)}</span>}
					/>
					<DetailItem
						label="Bandeira"
						value={
							brandAsset ? (
								<div className="flex items-center gap-2">
									<Image
										src={brandAsset}
										alt={`Bandeira ${cardBrand}`}
										width={32}
										height={32}
										className="h-5 w-auto rounded"
									/>
									<span className="truncate">{cardBrand}</span>
								</div>
							) : cardBrand ? (
								<span className="truncate">{cardBrand}</span>
							) : (
								<span className="text-muted-foreground">—</span>
							)
						}
					/>
					<DetailItem
						label="Status cartão"
						value={
							cardStatus ? (
								<div className="flex items-center gap-1.5">
									<DotIcon color={getCardStatusDotColor(cardStatus)} />
									<span className="truncate">{cardStatus}</span>
								</div>
							) : (
								<span className="text-muted-foreground">—</span>
							)
						}
					/>
				</div>

				<DetailItem
					label="Limite do cartão"
					value={limitLabel}
					className="sm:w-1/2"
				/>

				{/* Ações */}
				<div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-muted-foreground">
						{INVOICE_STATUS_DESCRIPTION[invoiceStatus]}
					</p>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant={actionVariantByStatus[invoiceStatus]}
							disabled={isPending}
							onClick={handleAction}
							className="w-full shrink-0 sm:w-auto"
						>
							{isPending ? "Salvando..." : actionLabelByStatus[invoiceStatus]}
						</Button>
						{invoiceStatus === INVOICE_PAYMENT_STATUS.PAID && (
							<EditPaymentDateDialog
								trigger={
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="shrink-0"
										aria-label="Editar data de pagamento"
									>
										<RiEditLine className="size-4" />
									</Button>
								}
								currentDate={paymentDate}
								onDateChange={handleDateChange}
							/>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

type DetailItemProps = {
	label?: string;
	value: React.ReactNode;
	className?: string;
};

function DetailItem({ label, value, className }: DetailItemProps) {
	return (
		<div className={cn("space-y-1", className)}>
			{label && (
				<span className="block text-xs font-medium uppercase text-muted-foreground/80">
					{label}
				</span>
			)}
			<div className="text-base text-foreground">{value}</div>
		</div>
	);
}
