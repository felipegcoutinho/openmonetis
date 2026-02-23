"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	currencyFormatter,
	formatCondition,
	formatDate,
	formatPeriod,
	getTransactionBadgeVariant,
} from "@/lib/lancamentos/formatting-helpers";
import { parseLocalDateString } from "@/lib/utils/date";
import { getPaymentMethodIcon } from "@/lib/utils/icons";
import { InstallmentTimeline } from "../shared/installment-timeline";
import type { LancamentoItem } from "../types";

interface LancamentoDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	lancamento: LancamentoItem | null;
}

export function LancamentoDetailsDialog({
	open,
	onOpenChange,
	lancamento,
}: LancamentoDetailsDialogProps) {
	if (!lancamento) return null;

	const isInstallment =
		lancamento.condition?.toLowerCase() === "parcelado" &&
		lancamento.currentInstallment &&
		lancamento.installmentCount;

	const valorParcela = Math.abs(lancamento.amount);
	const totalParcelas = lancamento.installmentCount ?? 1;
	const parcelaAtual = lancamento.currentInstallment ?? 1;
	const valorTotal = isInstallment
		? valorParcela * totalParcelas
		: valorParcela;
	const valorRestante = isInstallment
		? valorParcela * (totalParcelas - parcelaAtual)
		: 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 sm:max-w-xl">
				<div className="gap-2 space-y-4 py-6">
					<CardHeader className="flex flex-row items-start border-b">
						<div>
							<DialogTitle className="group flex items-center gap-2 text-lg">
								#{lancamento.id}
							</DialogTitle>
							<CardDescription>
								{formatDate(
									lancamento.originalPurchaseDate ?? lancamento.purchaseDate,
								)}
							</CardDescription>
						</div>
					</CardHeader>

					<CardContent className="text-sm">
						<div className="grid gap-3">
							<ul className="grid gap-3">
								<DetailRow label="Descrição" value={lancamento.name} />

								<DetailRow
									label="Período"
									value={formatPeriod(lancamento.period)}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Forma de Pagamento
									</span>
									<span className="flex items-center gap-1.5">
										{getPaymentMethodIcon(lancamento.paymentMethod)}
										<span className="capitalize">
											{lancamento.paymentMethod}
										</span>
									</span>
								</li>

								<DetailRow
									label={lancamento.cartaoName ? "Cartão" : "Conta"}
									value={lancamento.cartaoName ?? lancamento.contaName ?? "—"}
								/>

								<DetailRow
									label="Categoria"
									value={lancamento.categoriaName ?? "—"}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Tipo de Transação
									</span>
									<span className="capitalize">
										<Badge
											variant={getTransactionBadgeVariant(
												lancamento.categoriaName === "Saldo inicial"
													? "Saldo inicial"
													: lancamento.transactionType,
											)}
										>
											{lancamento.categoriaName === "Saldo inicial"
												? "Saldo Inicial"
												: lancamento.transactionType}
										</Badge>
									</span>
								</li>

								<DetailRow
									label="Condição"
									value={formatCondition(lancamento.condition)}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">Responsável</span>
									<span className="flex items-center gap-2 capitalize">
										<span>{lancamento.pagadorName}</span>
									</span>
								</li>

								<DetailRow
									label="Status"
									value={lancamento.isSettled ? "Pago" : "Pendente"}
								/>

								{lancamento.note && (
									<DetailRow label="Notas" value={lancamento.note} />
								)}
							</ul>

							<ul className="mb-6 grid gap-3">
								{isInstallment && (
									<li className="mt-4">
										<InstallmentTimeline
											purchaseDate={parseLocalDateString(
												lancamento.originalPurchaseDate ??
													lancamento.purchaseDate,
											)}
											currentInstallment={parcelaAtual}
											totalInstallments={totalParcelas}
											period={lancamento.period}
										/>
									</li>
								)}

								<DetailRow
									label={isInstallment ? "Valor da Parcela" : "Valor"}
									value={currencyFormatter.format(valorParcela)}
								/>

								{isInstallment && (
									<DetailRow
										label="Valor Restante"
										value={currencyFormatter.format(valorRestante)}
									/>
								)}

								{lancamento.recurrenceCount && (
									<DetailRow
										label="Quantidade de Recorrências"
										value={`${lancamento.recurrenceCount} meses`}
									/>
								)}

								{!isInstallment && <Separator className="my-2" />}

								<li className="flex items-center justify-between font-semibold">
									<span className="text-muted-foreground">Total da Compra</span>
									<span className="text-lg">
										{currencyFormatter.format(valorTotal)}
									</span>
								</li>
							</ul>
						</div>

						<DialogFooter>
							<DialogClose asChild>
								<Button className="w-full" type="button">
									Entendi
								</Button>
							</DialogClose>
						</DialogFooter>
					</CardContent>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface DetailRowProps {
	label: string;
	value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
	return (
		<li className="flex items-center justify-between">
			<span className="text-muted-foreground">{label}</span>
			<span className="capitalize">{value}</span>
		</li>
	);
}
