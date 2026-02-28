"use client";

import {
	RiBarcodeFill,
	RiCheckboxCircleFill,
	RiCheckboxCircleLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleLancamentoSettlementAction } from "@/app/(dashboard)/lancamentos/actions";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/money-values";
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
import type { DashboardBoleto } from "@/lib/dashboard/boletos";
import { cn } from "@/lib/utils/ui";
import { Badge } from "../ui/badge";
import { WidgetEmptyState } from "../widget-empty-state";

type BoletosWidgetProps = {
	boletos: DashboardBoleto[];
};

type ModalState = "idle" | "processing" | "success";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const buildDateLabel = (value: string | null, prefix?: string) => {
	if (!value) {
		return null;
	}

	const [year, month, day] = value.split("-").map((part) => Number(part));
	if (!year || !month || !day) {
		return null;
	}

	const formatted = DATE_FORMATTER.format(
		new Date(Date.UTC(year, month - 1, day)),
	);

	return prefix ? `${prefix} ${formatted}` : formatted;
};

const buildStatusLabel = (boleto: DashboardBoleto) => {
	if (boleto.isSettled) {
		return buildDateLabel(boleto.boletoPaymentDate, "Pago em");
	}

	return buildDateLabel(boleto.dueDate, "Vence em");
};

const getTodayDateString = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export function BoletosWidget({ boletos }: BoletosWidgetProps) {
	const router = useRouter();
	const [items, setItems] = useState(boletos);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalState, setModalState] = useState<ModalState>("idle");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setItems(boletos);
	}, [boletos]);

	const selectedBoleto = useMemo(
		() => items.find((boleto) => boleto.id === selectedId) ?? null,
		[items, selectedId],
	);

	const isProcessing = modalState === "processing" || isPending;

	const selectedBoletoDueLabel = selectedBoleto
		? buildDateLabel(selectedBoleto.dueDate, "Vencimento:")
		: null;

	const handleOpenModal = (boletoId: string) => {
		setSelectedId(boletoId);
		setModalState("idle");
		setIsModalOpen(true);
	};

	const resetModalState = () => {
		setIsModalOpen(false);
		setSelectedId(null);
		setModalState("idle");
	};

	const handleConfirmPayment = () => {
		if (!selectedBoleto || selectedBoleto.isSettled || isProcessing) {
			return;
		}

		setModalState("processing");

		startTransition(async () => {
			const result = await toggleLancamentoSettlementAction({
				id: selectedBoleto.id,
				value: true,
			});

			if (!result.success) {
				toast.error(result.error);
				setModalState("idle");
				return;
			}

			setItems((previous) =>
				previous.map((boleto) =>
					boleto.id === selectedBoleto.id
						? {
								...boleto,
								isSettled: true,
								boletoPaymentDate: getTodayDateString(),
							}
						: boleto,
				),
			);
			toast.success(result.message);
			router.refresh();
			setModalState("success");
		});
	};

	const getStatusBadgeVariant = (status: string): "success" | "info" => {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "pendente") {
			return "info";
		}
		return "success";
	};

	return (
		<>
			<CardContent className="flex flex-col gap-4 px-0">
				{items.length === 0 ? (
					<WidgetEmptyState
						icon={<RiBarcodeFill className="size-6 text-muted-foreground" />}
						title="Nenhum boleto cadastrado para o período selecionado"
						description="Cadastre boletos para monitorar os pagamentos aqui."
					/>
				) : (
					<ul className="flex flex-col">
						{items.map((boleto) => {
							const statusLabel = buildStatusLabel(boleto);
							const isOverdue = (() => {
								if (boleto.isSettled || !boleto.dueDate) return false;
								const [y, m, d] = boleto.dueDate.split("-").map(Number);
								if (!y || !m || !d) return false;
								return new Date(Date.UTC(y, m - 1, d)) < new Date();
							})();

							return (
								<li
									key={boleto.id}
									className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0"
								>
									<div className="flex min-w-0 flex-1 items-center gap-3 py-2">
										<EstabelecimentoLogo name={boleto.name} size={37} />

										<div className="min-w-0">
											<span className="block truncate text-sm font-medium text-foreground">
												{boleto.name}
											</span>
											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span
													className={cn(
														"rounded-full py-0.5",
														boleto.isSettled && "text-success",
													)}
												>
													{statusLabel}
												</span>
											</div>
										</div>
									</div>

									<div className="flex shrink-0 flex-col items-end">
										<MoneyValues amount={boleto.amount} />
										<Button
											type="button"
											size="sm"
											variant="link"
											className="h-auto p-0 disabled:opacity-100"
											disabled={boleto.isSettled}
											onClick={() => handleOpenModal(boleto.id)}
										>
											{boleto.isSettled ? (
												<span className="flex items-center gap-1 text-success">
													<RiCheckboxCircleFill className="size-3" /> Pago
												</span>
											) : isOverdue ? (
												<span className="overdue-blink">
													<span className="overdue-blink-primary text-destructive">
														Atrasado
													</span>
													<span className="overdue-blink-secondary">Pagar</span>
												</span>
											) : (
												"Pagar"
											)}
										</Button>
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
						if (isProcessing) {
							return;
						}
						resetModalState();
						return;
					}
					setIsModalOpen(true);
				}}
			>
				<DialogContent
					className="max-w-md"
					onEscapeKeyDown={(event) => {
						if (isProcessing) {
							event.preventDefault();
							return;
						}
						resetModalState();
					}}
					onPointerDownOutside={(event) => {
						if (isProcessing) {
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
									Pagamento registrado!
								</DialogTitle>
								<DialogDescription className="text-sm">
									Atualizamos o status do boleto para pago. Em instantes ele
									aparecerá como baixado no histórico.
								</DialogDescription>
							</div>
							<ModalFooter className="sm:justify-center">
								<Button
									type="button"
									onClick={resetModalState}
									className="sm:w-auto"
								>
									Fechar
								</Button>
							</ModalFooter>
						</div>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Confirmar pagamento do boleto</DialogTitle>
								<DialogDescription>
									Confirme os dados para registrar o pagamento. Você poderá
									editar o lançamento depois, se necessário.
								</DialogDescription>
							</DialogHeader>

							{selectedBoleto ? (
								<div className="space-y-4">
									<div className="rounded-lg border p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
													<RiBarcodeFill className="size-5 text-primary" />
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Boleto
													</p>
													<p className="text-lg font-bold text-foreground">
														{selectedBoleto.name}
													</p>
												</div>
											</div>
											{selectedBoletoDueLabel ? (
												<div className="text-right">
													<p className="text-sm text-muted-foreground">
														{selectedBoletoDueLabel}
													</p>
												</div>
											) : null}
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-lg border p-3">
											<div className="mb-2 flex items-center gap-2 text-muted-foreground">
												<RiMoneyDollarCircleLine className="size-4" />
												<span className="text-xs font-semibold uppercase">
													Valor do Boleto
												</span>
											</div>
											<MoneyValues
												amount={selectedBoleto.amount}
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
													selectedBoleto.isSettled ? "Pago" : "Pendente",
												)}
											>
												{selectedBoleto.isSettled ? "Pago" : "Pendente"}
											</Badge>
										</div>
									</div>
								</div>
							) : null}

							<ModalFooter className="sm:justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={resetModalState}
									disabled={isProcessing}
								>
									Cancelar
								</Button>
								<Button
									type="button"
									onClick={handleConfirmPayment}
									disabled={
										isProcessing || !selectedBoleto || selectedBoleto.isSettled
									}
									className="relative"
								>
									{isProcessing ? (
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
