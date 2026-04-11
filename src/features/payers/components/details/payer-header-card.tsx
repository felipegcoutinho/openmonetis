"use client";

import {
	RiBankCard2Line,
	RiBillLine,
	RiExchangeDollarLine,
	RiMailLine,
	RiMailSendLine,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendPayerSummaryAction } from "@/features/payers/detail-actions";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import type { PayerInfo, PayerSummaryPreview } from "./types";

type PayerHeaderCardProps = {
	payer: PayerInfo;
	selectedPeriod: string;
	summary: PayerSummaryPreview;
};

export function PayerHeaderCard({
	payer,
	selectedPeriod,
	summary,
}: PayerHeaderCardProps) {
	const router = useRouter();
	const [isSending, startTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const avatarSrc = getAvatarSrc(payer.avatarUrl);
	const isDataUrl = avatarSrc.startsWith("data:");
	const createdAtLabel = formatDate(payer.createdAt);
	const isAdmin = payer.role === PAYER_ROLE_ADMIN;

	const lastMailLabel =
		formatDateTime(payer.lastMailAt, {
			dateStyle: "short",
			timeStyle: "short",
		}) ?? "Nunca enviado";

	const disableSend = isSending || !payer.email || !payer.canEdit;

	const openConfirmDialog = () => {
		if (!payer.email) {
			toast.error("Cadastre um e-mail para este pagador antes de enviar.");
			return;
		}
		setConfirmOpen(true);
	};

	const handleSendSummary = () => {
		if (!payer.email) {
			toast.error("Cadastre um e-mail para este pagador antes de enviar.");
			return;
		}

		startTransition(async () => {
			const result = await sendPayerSummaryAction({
				payerId: payer.id,
				period: selectedPeriod,
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			toast.success(result.message);
			setConfirmOpen(false);
			router.refresh();
		});
	};

	const getStatusBadgeVariant = (status: string): "success" | "outline" => {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "ativo") {
			return "success";
		}
		return "outline";
	};

	return (
		<Card className="mb-2 border gap-4">
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-1 items-start gap-4">
					<div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden">
						<Image
							src={avatarSrc}
							unoptimized={isDataUrl}
							alt={`Avatar de ${payer.name}`}
							width={64}
							height={64}
							className="h-full w-full rounded-full object-cover"
						/>
					</div>

					<div className="flex flex-1 flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<CardTitle className="text-xl font-semibold text-foreground">
								{payer.name}
							</CardTitle>
							{isAdmin ? (
								<RiVerifiedBadgeFill
									className="size-4 text-sky-500"
									aria-hidden
								/>
							) : null}
							<Badge
								variant={getStatusBadgeVariant(payer.status)}
								className="text-xs"
							>
								{payer.status}
							</Badge>
							{payer.isAutoSend ? (
								<Badge variant="info" className="gap-1 text-xs">
									<RiMailSendLine className="size-3.5" aria-hidden />
									Envio automático
								</Badge>
							) : null}
						</div>

						<CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
							<span>Criado em {createdAtLabel}</span>
							<span className="hidden text-border/80 sm:inline">•</span>
							{payer.email ? (
								<Link
									prefetch
									href={`mailto:${payer.email}`}
									className="inline-flex items-center gap-1.5 text-primary"
								>
									<RiMailLine className="size-4" aria-hidden />
									{payer.email}
								</Link>
							) : (
								<span>Sem e-mail cadastrado</span>
							)}
						</CardDescription>
					</div>
				</div>

				<div className="flex w-full flex-col items-stretch gap-2 lg:w-auto lg:items-end">
					{payer.canEdit ? (
						<>
							<Button
								type="button"
								size="sm"
								onClick={openConfirmDialog}
								disabled={disableSend}
								className="w-full min-w-[180px] lg:w-auto"
							>
								{isSending ? "Enviando..." : "Enviar resumo"}
							</Button>
							<span className="text-xs text-muted-foreground">
								Último envio: {lastMailLabel}
							</span>
						</>
					) : (
						<Badge variant="outline" className="justify-center text-xs">
							Acesso somente leitura
						</Badge>
					)}
				</div>
			</CardHeader>

			{payer.canEdit ? (
				<Dialog
					open={confirmOpen}
					onOpenChange={(open) => {
						if (isSending) return;
						setConfirmOpen(open);
					}}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Confirmar envio do resumo</DialogTitle>
							<DialogDescription>
								Resumo de{" "}
								<span className="font-medium text-foreground">
									{summary.periodLabel}
								</span>{" "}
								para{" "}
								<span className="font-medium text-foreground">
									{payer.email}
								</span>
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
											<RiExchangeDollarLine className="size-5 text-primary" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">
												Total de Despesas
											</p>
											<p className="text-2xl font-semibold text-foreground">
												{formatCurrency(summary.totalExpenses)}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm text-muted-foreground">
											{summary.lancamentoCount} lançamentos
										</p>
									</div>
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-lg border p-3">
									<div className="mb-2 flex items-center gap-2 text-muted-foreground">
										<RiBankCard2Line className="size-4" />
										<span className="text-xs font-medium uppercase">
											Cartões
										</span>
									</div>
									<p className="text-lg font-semibold text-foreground">
										{formatCurrency(summary.paymentSplits.card)}
									</p>
								</div>

								<div className="rounded-lg border p-3">
									<div className="mb-2 flex items-center gap-2 text-muted-foreground">
										<RiBillLine className="size-4" />
										<span className="text-xs font-medium uppercase">
											Boletos
										</span>
									</div>
									<p className="text-lg font-semibold text-foreground">
										{formatCurrency(summary.paymentSplits.boleto)}
									</p>
								</div>

								<div className="rounded-lg border p-3">
									<div className="mb-2 flex items-center gap-2 text-muted-foreground">
										<RiExchangeDollarLine className="size-4" />
										<span className="text-xs font-medium uppercase">
											Pix/Débito
										</span>
									</div>
									<p className="text-lg font-semibold text-foreground">
										{formatCurrency(summary.paymentSplits.instant)}
									</p>
								</div>
							</div>

							<div className="space-y-3">
								{summary.cardUsage.length > 0 && (
									<div className="rounded-lg border p-3">
										<div className="mb-2 flex items-center gap-2">
											<RiBankCard2Line className="size-4 text-muted-foreground" />
											<span className="text-xs font-medium uppercase text-muted-foreground">
												Cartões Utilizados
											</span>
										</div>
										<div className="space-y-1">
											{summary.cardUsage.map((card, index) => (
												<div
													key={index}
													className="flex items-center justify-between text-sm"
												>
													<span className="text-foreground">{card.name}</span>
													<span className="font-medium text-foreground">
														{formatCurrency(card.amount)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								{(summary.boletoStats.paidCount > 0 ||
									summary.boletoStats.pendingCount > 0) && (
									<div className="rounded-lg border p-3">
										<div className="mb-2 flex items-center gap-2">
											<RiBillLine className="size-4 text-muted-foreground" />
											<span className="text-xs font-medium uppercase text-muted-foreground">
												Status de Boletos
											</span>
										</div>
										<div className="grid gap-2 sm:grid-cols-2">
											<div>
												<p className="text-xs text-muted-foreground">Pagos</p>
												<p className="text-sm font-medium text-success">
													{formatCurrency(summary.boletoStats.paidAmount)}{" "}
													<span className="text-xs font-normal">
														({summary.boletoStats.paidCount})
													</span>
												</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">
													Pendentes
												</p>
												<p className="text-sm font-medium text-warning">
													{formatCurrency(summary.boletoStats.pendingAmount)}{" "}
													<span className="text-xs font-normal">
														({summary.boletoStats.pendingCount})
													</span>
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={isSending}
								onClick={() => setConfirmOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={handleSendSummary}
								disabled={disableSend}
							>
								{isSending ? "Enviando..." : "Confirmar envio"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</Card>
	);
}

const formatDate = (value: string) => {
	return (
		formatDateTime(value, {
			day: "2-digit",
			month: "long",
			year: "numeric",
		}) ?? "—"
	);
};
