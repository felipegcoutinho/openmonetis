"use client";

import {
	currencyFormatter,
	formatCondition,
	formatDate,
	formatPeriod,
} from "@/features/transactions/formatting-helpers";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import { Button } from "@/shared/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
} from "@/shared/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { parseLocalDateString } from "@/shared/utils/date";
import { getPaymentMethodIcon } from "@/shared/utils/icons";
import { InstallmentTimeline } from "../shared/installment-timeline";
import type { TransactionItem } from "../types";

interface TransactionDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: TransactionItem | null;
}

export function TransactionDetailsDialog({
	open,
	onOpenChange,
	transaction,
}: TransactionDetailsDialogProps) {
	if (!transaction) return null;

	const isInstallment =
		transaction.condition?.toLowerCase() === "parcelado" &&
		transaction.currentInstallment &&
		transaction.installmentCount;

	const valorParcela = Math.abs(transaction.amount);
	const totalParcelas = transaction.installmentCount ?? 1;
	const parcelaAtual = transaction.currentInstallment ?? 1;
	const valorTotal = isInstallment
		? valorParcela * totalParcelas
		: valorParcela;
	const valorRestante = isInstallment
		? valorParcela * (totalParcelas - parcelaAtual)
		: 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 sm:max-w-xl sm:border-0 sm:p-2">
				<div className="gap-2 space-y-4 py-4">
					<CardHeader className="flex flex-row items-start border-b sm:border-b-0">
						<div>
							<DialogTitle className="group flex items-center gap-2 text-lg">
								#{transaction.id}
							</DialogTitle>
							<CardDescription>
								{formatDate(transaction.purchaseDate)}
							</CardDescription>
						</div>
					</CardHeader>

					<CardContent className="text-sm">
						<div className="grid gap-3">
							<ul className="grid gap-3">
								<DetailRow label="Descrição" value={transaction.name} />

								<DetailRow
									label="Período"
									value={formatPeriod(transaction.period)}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Forma de Pagamento
									</span>
									<span className="flex items-center gap-1.5">
										{getPaymentMethodIcon(transaction.paymentMethod)}
										<span className="capitalize">
											{transaction.paymentMethod}
										</span>
									</span>
								</li>

								<DetailRow
									label={transaction.cartaoName ? "Cartão" : "Conta"}
									value={transaction.cartaoName ?? transaction.contaName ?? "—"}
								/>

								<DetailRow
									label="Categoria"
									value={transaction.categoriaName ?? "—"}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Tipo de Transação
									</span>
									<TransactionTypeBadge
										kind={
											transaction.categoriaName === "Saldo inicial"
												? "Saldo inicial"
												: transaction.transactionType
										}
									/>
								</li>

								<DetailRow
									label="Condição"
									value={formatCondition(transaction.condition)}
								/>

								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">Responsável</span>
									<span className="flex items-center gap-2 capitalize">
										<span>{transaction.pagadorName}</span>
									</span>
								</li>

								<DetailRow
									label="Status"
									value={transaction.isSettled ? "Pago" : "Pendente"}
								/>

								{transaction.note && (
									<DetailRow label="Notas" value={transaction.note} />
								)}
							</ul>

							<ul className="mb-6 grid gap-3">
								{isInstallment && (
									<li className="mt-4">
										<InstallmentTimeline
											purchaseDate={parseLocalDateString(
												transaction.purchaseDate,
											)}
											currentInstallment={parcelaAtual}
											totalInstallments={totalParcelas}
											period={transaction.period}
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

								{transaction.recurrenceCount && (
									<DetailRow
										label="Quantidade de Recorrências"
										value={`${transaction.recurrenceCount} meses`}
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
								<Button type="button">Entendi</Button>
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
