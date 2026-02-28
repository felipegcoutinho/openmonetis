"use client";
import {
	RiBillLine,
	RiCheckboxCircleFill,
	RiCheckboxCircleLine,
	RiExternalLinkLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateInvoicePaymentStatusAction } from "@/app/(dashboard)/cartoes/[cartaoId]/fatura/actions";
import MoneyValues from "@/components/money-values";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter as ModalFooter,
} from "@/components/ui/dialog";
import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import { INVOICE_PAYMENT_STATUS, INVOICE_STATUS_LABEL } from "@/lib/faturas";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { formatPeriodForUrl } from "@/lib/utils/period";
import { Badge } from "../ui/badge";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";
import { WidgetEmptyState } from "../widget-empty-state";

type InvoicesWidgetProps = {
	invoices: DashboardInvoice[];
};

type ModalState = "idle" | "processing" | "success";

const DUE_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const resolveLogoPath = (logo: string | null) => {
	if (!logo) {
		return null;
	}
	if (/^(https?:\/\/|data:)/.test(logo)) {
		return logo;
	}
	return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

const buildInitials = (value: string) => {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "CC";
	}
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CC";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "CC";
};

const parseDueDate = (period: string, dueDay: string) => {
	const [yearStr, monthStr] = period.split("-");
	const dayNumber = Number.parseInt(dueDay, 10);
	const year = Number.parseInt(yearStr ?? "", 10);
	const month = Number.parseInt(monthStr ?? "", 10);

	if (
		Number.isNaN(dayNumber) ||
		Number.isNaN(year) ||
		Number.isNaN(month) ||
		period.length !== 7
	) {
		return {
			label: `Vence dia ${dueDay}`,
			date: null,
		};
	}

	const date = new Date(Date.UTC(year, month - 1, dayNumber));
	return {
		label: `Vence em ${DUE_DATE_FORMATTER.format(date)}`,
		date,
	};
};

const formatPaymentDate = (value: string | null) => {
	if (!value) {
		return null;
	}

	const [yearStr, monthStr, dayStr] = value.split("-");
	const year = Number.parseInt(yearStr ?? "", 10);
	const month = Number.parseInt(monthStr ?? "", 10);
	const day = Number.parseInt(dayStr ?? "", 10);

	if (
		Number.isNaN(year) ||
		Number.isNaN(month) ||
		Number.isNaN(day) ||
		yearStr?.length !== 4 ||
		monthStr?.length !== 2 ||
		dayStr?.length !== 2
	) {
		return null;
	}

	const date = new Date(Date.UTC(year, month - 1, day));
	return {
		label: `Pago em ${DUE_DATE_FORMATTER.format(date)}`,
	};
};

const getTodayDateString = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const formatSharePercentage = (value: number) => {
	if (!Number.isFinite(value) || value <= 0) {
		return "0%";
	}
	const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
	return `${value.toLocaleString("pt-BR", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	})}%`;
};

const getShareLabel = (amount: number, total: number) => {
	if (total <= 0) {
		return "0% do total";
	}
	const percentage = (amount / total) * 100;
	return `${formatSharePercentage(percentage)} do total`;
};

export function InvoicesWidget({ invoices }: InvoicesWidgetProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [items, setItems] = useState(invoices);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [modalState, setModalState] = useState<ModalState>("idle");

	useEffect(() => {
		setItems(invoices);
	}, [invoices]);

	const selectedInvoice = useMemo(
		() => items.find((invoice) => invoice.id === selectedId) ?? null,
		[items, selectedId],
	);

	const selectedLogo = useMemo(
		() => (selectedInvoice ? resolveLogoPath(selectedInvoice.logo) : null),
		[selectedInvoice],
	);

	const selectedPaymentInfo = useMemo(
		() => (selectedInvoice ? formatPaymentDate(selectedInvoice.paidAt) : null),
		[selectedInvoice],
	);

	const handleOpenModal = (invoiceId: string) => {
		setSelectedId(invoiceId);
		setModalState("idle");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setModalState("idle");
		setSelectedId(null);
	};

	const handleConfirmPayment = () => {
		if (!selectedInvoice) {
			return;
		}

		setModalState("processing");

		startTransition(async () => {
			const result = await updateInvoicePaymentStatusAction({
				cartaoId: selectedInvoice.cardId,
				period: selectedInvoice.period,
				status: INVOICE_PAYMENT_STATUS.PAID,
			});

			if (result.success) {
				toast.success(result.message);
				setItems((previous) =>
					previous.map((invoice) =>
						invoice.id === selectedInvoice.id
							? {
									...invoice,
									paymentStatus: INVOICE_PAYMENT_STATUS.PAID,
									paidAt: getTodayDateString(),
								}
							: invoice,
					),
				);
				setModalState("success");
				router.refresh();
				return;
			}

			toast.error(result.error);
			setModalState("idle");
		});
	};

	const getStatusBadgeVariant = (status: string): "success" | "info" => {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "em aberto") {
			return "info";
		}
		return "success";
	};

	return (
		<>
			<CardContent className="flex flex-col gap-4 px-0">
				{items.length === 0 ? (
					<WidgetEmptyState
						icon={<RiBillLine className="size-6 text-muted-foreground" />}
						title="Nenhuma fatura para o período selecionado"
						description="Quando houver cartões com compras registradas, eles aparecerão aqui."
					/>
				) : (
					<ul className="flex flex-col">
						{items.map((invoice) => {
							const logo = resolveLogoPath(invoice.logo);
							const initials = buildInitials(invoice.cardName);
							const dueInfo = parseDueDate(invoice.period, invoice.dueDay);
							const isPaid =
								invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID;
							const isOverdue =
								!isPaid && dueInfo.date !== null && dueInfo.date < new Date();
							const paymentInfo = formatPaymentDate(invoice.paidAt);

							return (
								<li
									key={invoice.id}
									className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0"
								>
									<div className="flex min-w-0 flex-1 items-center gap-2 py-2">
										<div className="flex size-9.5 shrink-0 items-center justify-center overflow-hidden rounded-full">
											{logo ? (
												<Image
													src={logo}
													alt={`Logo do cartão ${invoice.cardName}`}
													width={36}
													height={36}
													className="h-full w-full object-contain"
												/>
											) : (
												<span className="text-sm font-semibold uppercase text-muted-foreground">
													{initials}
												</span>
											)}
										</div>

										<div className="min-w-0">
											{(() => {
												const breakdown = invoice.pagadorBreakdown ?? [];
												const hasBreakdown = breakdown.length > 0;
												const linkNode = (
													<Link
														prefetch
														href={`/cartoes/${
															invoice.cardId
														}/fatura?periodo=${formatPeriodForUrl(
															invoice.period,
														)}`}
														className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
													>
														<span className="truncate">{invoice.cardName}</span>
														<RiExternalLinkLine
															className="size-3 shrink-0 text-muted-foreground"
															aria-hidden
														/>
													</Link>
												);

												if (!hasBreakdown) {
													return linkNode;
												}

												const totalForShare = Math.abs(invoice.totalAmount);

												return (
													<HoverCard openDelay={150}>
														<HoverCardTrigger asChild>
															{linkNode}
														</HoverCardTrigger>
														<HoverCardContent
															align="start"
															className="w-72 space-y-3"
														>
															<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
																Distribuição por pagador
															</p>
															<ul className="space-y-2">
																{breakdown.map((share, index) => (
																	<li
																		key={`${invoice.id}-${
																			share.pagadorId ??
																			share.pagadorName ??
																			index
																		}`}
																		className="flex items-center gap-3"
																	>
																		<Avatar className="size-9">
																			<AvatarImage
																				src={getAvatarSrc(share.pagadorAvatar)}
																				alt={`Avatar de ${share.pagadorName}`}
																			/>
																			<AvatarFallback>
																				{buildInitials(share.pagadorName)}
																			</AvatarFallback>
																		</Avatar>
																		<div className="min-w-0 flex-1">
																			<p className="truncate text-sm font-medium text-foreground">
																				{share.pagadorName}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{getShareLabel(
																					share.amount,
																					totalForShare,
																				)}
																			</p>
																		</div>
																		<div className="text-sm font-semibold text-foreground">
																			<MoneyValues amount={share.amount} />
																		</div>
																	</li>
																))}
															</ul>
														</HoverCardContent>
													</HoverCard>
												);
											})()}
											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												{!isPaid ? <span>{dueInfo.label}</span> : null}
												{isPaid && paymentInfo ? (
													<span className="text-success">
														{paymentInfo.label}
													</span>
												) : null}
											</div>
										</div>
									</div>

									<div className="flex shrink-0 flex-col items-end">
										<MoneyValues amount={Math.abs(invoice.totalAmount)} />
										<div className="flex items-center gap-2">
											<Button
												type="button"
												size="sm"
												disabled={isPaid}
												onClick={() => handleOpenModal(invoice.id)}
												variant={"link"}
												className="p-0 h-auto disabled:opacity-100"
											>
												{isPaid ? (
													<span className="text-success flex items-center gap-1">
														<RiCheckboxCircleFill className="size-3" /> Pago
													</span>
												) : isOverdue ? (
													<span className="overdue-blink">
														<span className="overdue-blink-primary text-destructive">
															Atrasado
														</span>
														<span className="overdue-blink-secondary">
															Pagar
														</span>
													</span>
												) : (
													<span>Pagar</span>
												)}
											</Button>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>

			<Dialog
				open={isModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						handleCloseModal();
						return;
					}
					setIsModalOpen(true);
				}}
			>
				<DialogContent
					className="max-w-md"
					onEscapeKeyDown={(event) => {
						if (modalState === "processing") {
							event.preventDefault();
							return;
						}
						handleCloseModal();
					}}
					onPointerDownOutside={(event) => {
						if (modalState === "processing") {
							event.preventDefault();
						}
					}}
				>
					{modalState === "success" ? (
						<div className="flex flex-col items-center gap-4 py-6 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
								<RiCheckboxCircleLine className="size-8" />
							</div>
							<div className="space-y-2">
								<DialogTitle className="text-base">
									Pagamento confirmado!
								</DialogTitle>
								<DialogDescription className="text-sm">
									Atualizamos o status da fatura. O lançamento do pagamento
									aparecerá no extrato em instantes.
								</DialogDescription>
							</div>
							<ModalFooter className="sm:justify-center">
								<Button
									type="button"
									onClick={handleCloseModal}
									className="sm:w-auto"
								>
									Fechar
								</Button>
							</ModalFooter>
						</div>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Confirmar pagamento</DialogTitle>
								<DialogDescription>
									Revise os dados antes de confirmar. Vamos registrar a fatura
									como paga.
								</DialogDescription>
							</DialogHeader>

							{selectedInvoice ? (
								<div className="space-y-4">
									<div className="rounded-lg border p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
													{selectedLogo ? (
														<Image
															src={selectedLogo}
															alt={`Logo do cartão ${selectedInvoice.cardName}`}
															width={40}
															height={40}
															className="h-full w-full object-contain"
														/>
													) : (
														<span className="text-xs font-semibold uppercase text-primary">
															{buildInitials(selectedInvoice.cardName)}
														</span>
													)}
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Cartão
													</p>
													<p className="text-lg font-bold text-foreground">
														{selectedInvoice.cardName}
													</p>
												</div>
											</div>
											<div className="text-right">
												{selectedInvoice.paymentStatus !==
												INVOICE_PAYMENT_STATUS.PAID ? (
													<p className="text-sm text-muted-foreground">
														{
															parseDueDate(
																selectedInvoice.period,
																selectedInvoice.dueDay,
															).label
														}
													</p>
												) : null}
												{selectedInvoice.paymentStatus ===
													INVOICE_PAYMENT_STATUS.PAID && selectedPaymentInfo ? (
													<p className="text-sm text-success">
														{selectedPaymentInfo.label}
													</p>
												) : null}
											</div>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-lg border p-3">
											<div className="mb-2 flex items-center gap-2 text-muted-foreground">
												<RiMoneyDollarCircleLine className="size-4" />
												<span className="text-xs font-semibold uppercase">
													Valor da Fatura
												</span>
											</div>
											<MoneyValues
												amount={Math.abs(selectedInvoice.totalAmount)}
												className="text-lg font-bold"
											/>
										</div>
										<div className="rounded-lg border p-3">
											<div className="mb-2 flex items-center gap-2 text-muted-foreground">
												<RiCheckboxCircleLine className="size-4" />
												<span className="text-xs font-semibold uppercase">
													Status
												</span>
											</div>
											<Badge
												variant={getStatusBadgeVariant(
													INVOICE_STATUS_LABEL[selectedInvoice.paymentStatus],
												)}
											>
												{INVOICE_STATUS_LABEL[selectedInvoice.paymentStatus]}
											</Badge>
										</div>
									</div>
								</div>
							) : null}

							<ModalFooter className="sm:justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseModal}
									disabled={modalState === "processing"}
								>
									Cancelar
								</Button>
								<Button
									type="button"
									onClick={handleConfirmPayment}
									disabled={modalState === "processing" || isPending}
									className="relative"
								>
									{modalState === "processing" || isPending ? (
										<>
											<RiLoader4Line className="mr-1.5 size-4 animate-spin" />
											Processando...
										</>
									) : (
										"Confirmar pagamento"
									)}
								</Button>
							</ModalFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
