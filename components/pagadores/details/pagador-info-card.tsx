"use client";

import {
	RiBankCard2Line,
	RiBillLine,
	RiExchangeDollarLine,
	RiMailLine,
	RiMailSendLine,
	RiUser3Line,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendPagadorSummaryAction } from "@/app/(dashboard)/pagadores/[pagadorId]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { cn } from "@/lib/utils/ui";

type PagadorInfo = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	status: string;
	note: string | null;
	role: string | null;
	isAutoSend: boolean;
	createdAt: string;
	lastMailAt: string | null;
	shareCode: string | null;
	canEdit: boolean;
};

type PagadorSummaryPreview = {
	periodLabel: string;
	totalExpenses: number;
	paymentSplits: {
		card: number;
		boleto: number;
		instant: number;
	};
	cardUsage: { name: string; amount: number }[];
	boletoStats: {
		totalAmount: number;
		paidAmount: number;
		pendingAmount: number;
		paidCount: number;
		pendingCount: number;
	};
	lancamentoCount: number;
};

type PagadorInfoCardProps = {
	pagador: PagadorInfo;
	selectedPeriod: string;
	summary: PagadorSummaryPreview;
};

export function PagadorInfoCard({
	pagador,
	selectedPeriod,
	summary,
}: PagadorInfoCardProps) {
	const router = useRouter();
	const [isSending, startTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const avatarSrc = getAvatarSrc(pagador.avatarUrl);
	const createdAtLabel = formatDate(pagador.createdAt);
	const isAdmin = pagador.role === PAGADOR_ROLE_ADMIN;

	const lastMailLabel = useMemo(() => {
		if (!pagador.lastMailAt) {
			return "Nunca enviado";
		}
		const date = new Date(pagador.lastMailAt);
		if (Number.isNaN(date.getTime())) {
			return "Nunca enviado";
		}
		return date.toLocaleString("pt-BR", {
			dateStyle: "short",
			timeStyle: "short",
		});
	}, [pagador.lastMailAt]);

	const disableSend = isSending || !pagador.email || !pagador.canEdit;

	const openConfirmDialog = () => {
		if (!pagador.email) {
			toast.error("Cadastre um e-mail para este pagador antes de enviar.");
			return;
		}
		setConfirmOpen(true);
	};

	const handleSendSummary = () => {
		if (!pagador.email) {
			toast.error("Cadastre um e-mail para este pagador antes de enviar.");
			return;
		}

		startTransition(async () => {
			const result = await sendPagadorSummaryAction({
				pagadorId: pagador.id,
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

	const getStatusBadgeVariant = (status: string): "success" | "secondary" => {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "ativo") {
			return "success";
		}
		return "outline";
	};

	return (
		<Card className="border gap-4">
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-1 items-start gap-4">
					<div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden">
						<Image
							src={avatarSrc}
							alt={`Avatar de ${pagador.name}`}
							width={64}
							height={64}
							className="h-full w-full object-cover rounded-full"
						/>
					</div>

					<div className="flex flex-1 flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<CardTitle className="text-xl font-semibold text-foreground">
								{pagador.name}
							</CardTitle>
							{isAdmin ? (
								<RiVerifiedBadgeFill
									className="size-4 text-sky-500"
									aria-hidden
								/>
							) : null}
							{pagador.isAutoSend ? (
								<RiMailSendLine
									className="size-4 text-primary"
									aria-label="Envio automático habilitado"
								/>
							) : null}
						</div>
						<span className="text-sm text-muted-foreground">
							Criado em {createdAtLabel}
						</span>
					</div>
				</div>

				<div className="flex w-full flex-col items-stretch gap-2 lg:w-auto lg:items-end">
					{pagador.canEdit ? (
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
						<span className="text-xs font-medium text-warning">
							Acesso somente leitura
						</span>
					)}
				</div>
			</CardHeader>

			<CardContent className="grid gap-4 border-t border-dashed border-border/60 pt-6 text-sm sm:grid-cols-2">
				<InfoItem
					label="E-mail"
					value={
						pagador.email ? (
							<Link
								prefetch
								href={`mailto:${pagador.email}`}
								className="inline-flex items-center gap-2 text-primary"
							>
								<RiMailLine className="size-4" aria-hidden />
								{pagador.email}
							</Link>
						) : (
							"Sem e-mail cadastrado"
						)
					}
				/>
				<InfoItem
					label="Status"
					value={
						<Badge
							variant={getStatusBadgeVariant(pagador.status)}
							className="text-xs"
						>
							{pagador.status}
						</Badge>
					}
				/>

				<InfoItem
					label="Papel"
					value={
						<span className="inline-flex items-center gap-2">
							<RiUser3Line className="size-4 text-muted-foreground" />
							{resolveRoleLabel(pagador.role)}
						</span>
					}
				/>
				<InfoItem
					label="Envio automático"
					value={pagador.isAutoSend ? "Ativado" : "Desativado"}
				/>
				{!pagador.email ? (
					<InfoItem
						label="Aviso"
						value={
							<span className="text-[13px] text-warning">
								Cadastre um e-mail para permitir o envio automático.
							</span>
						}
						className="sm:col-span-2"
					/>
				) : null}
				<InfoItem
					label="Observações"
					value={
						pagador.note ? (
							<span className="text-muted-foreground">{pagador.note}</span>
						) : (
							"Sem observações"
						)
					}
					className="sm:col-span-2"
				/>
			</CardContent>

			{pagador.canEdit ? (
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
								<span className="font-semibold text-foreground">
									{summary.periodLabel}
								</span>{" "}
								para{" "}
								<span className="font-medium text-foreground">
									{pagador.email}
								</span>
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							{/* Total Geral */}
							<div className="rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
											<RiExchangeDollarLine className="size-5 text-primary" />
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Total de Despesas
											</p>
											<p className="text-2xl font-bold text-foreground">
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

							{/* Grid de Formas de Pagamento */}
							<div className="grid gap-3 sm:grid-cols-3">
								{/* Cartões */}
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-2 text-muted-foreground mb-2">
										<RiBankCard2Line className="size-4" />
										<span className="text-xs font-semibold uppercase">
											Cartões
										</span>
									</div>
									<p className="text-lg font-bold text-foreground">
										{formatCurrency(summary.paymentSplits.card)}
									</p>
								</div>

								{/* Boletos */}
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-2 text-muted-foreground mb-2">
										<RiBillLine className="size-4" />
										<span className="text-xs font-semibold uppercase">
											Boletos
										</span>
									</div>
									<p className="text-lg font-bold text-foreground">
										{formatCurrency(summary.paymentSplits.boleto)}
									</p>
								</div>

								{/* Instantâneo */}
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-2 text-muted-foreground mb-2">
										<RiExchangeDollarLine className="size-4" />
										<span className="text-xs font-semibold uppercase">
											Pix/Débito
										</span>
									</div>
									<p className="text-lg font-bold text-foreground">
										{formatCurrency(summary.paymentSplits.instant)}
									</p>
								</div>
							</div>

							{/* Detalhes Adicionais */}
							<div className="space-y-3">
								{/* Cartões Utilizados */}
								{summary.cardUsage.length > 0 && (
									<div className="rounded-lg border p-3">
										<div className="flex items-center gap-2 mb-2">
											<RiBankCard2Line className="size-4 text-muted-foreground" />
											<span className="text-xs font-semibold uppercase text-muted-foreground">
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

								{/* Status de Boletos */}
								{(summary.boletoStats.paidCount > 0 ||
									summary.boletoStats.pendingCount > 0) && (
									<div className="rounded-lg border p-3">
										<div className="flex items-center gap-2 mb-2">
											<RiBillLine className="size-4 text-muted-foreground" />
											<span className="text-xs font-semibold uppercase text-muted-foreground">
												Status de Boletos
											</span>
										</div>
										<div className="grid gap-2 sm:grid-cols-2">
											<div>
												<p className="text-xs text-muted-foreground">Pagos</p>
												<p className="text-sm font-semibold text-success">
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
												<p className="text-sm font-semibold text-warning">
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
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

const resolveRoleLabel = (role: string | null) => {
	if (role === PAGADOR_ROLE_ADMIN) return "Administrador";
	return "Pagador";
};

const formatCurrency = (value: number) =>
	value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 2,
	});

type InfoItemProps = {
	label: string;
	value: ReactNode;
	className?: string;
};

function InfoItem({ label, value, className }: InfoItemProps) {
	return (
		<div className={cn("space-y-1", className)}>
			<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
				{label}
			</span>
			<div className="text-base text-foreground">{value}</div>
		</div>
	);
}
