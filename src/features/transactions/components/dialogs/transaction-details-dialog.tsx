"use client";

import {
	currencyFormatter,
	formatCondition,
	formatDate,
	formatPeriod,
} from "@/features/transactions/formatting-helpers";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
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
	onEdit?: (transaction: TransactionItem) => void;
}

export function TransactionDetailsDialog({
	open,
	onOpenChange,
	transaction,
	onEdit,
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

	const isBoleto = transaction.paymentMethod === "Boleto";

	const handleEdit = () => {
		onOpenChange(false);
		onEdit?.(transaction);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{transaction.name}</DialogTitle>
					<DialogDescription>
						{formatDate(transaction.purchaseDate)}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60vh] overflow-y-auto text-sm">
					<div className="grid gap-3">
						<ul className="grid gap-3">
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
									<span>{transaction.paymentMethod}</span>
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
								<span className="text-muted-foreground">Tipo de Transação</span>
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
								<span>{transaction.pagadorName}</span>
							</li>

							<li className="flex items-center justify-between">
								<span className="text-muted-foreground">Status</span>
								<Badge
									variant="secondary"
									className={
										transaction.isSettled
											? "text-success bg-success/10"
											: "text-muted-foreground"
									}
								>
									{transaction.isSettled ? "Pago" : "Pendente"}
								</Badge>
							</li>

							{isBoleto && transaction.dueDate && (
								<DetailRow
									label="Vencimento"
									value={formatDate(transaction.dueDate)}
								/>
							)}

							{transaction.isDivided && (
								<li className="flex items-center justify-between">
									<span className="text-muted-foreground">Divisão</span>
									<Badge variant="outline">Dividido</Badge>
								</li>
							)}

							{transaction.note && (
								<li className="flex flex-col gap-1">
									<span className="text-muted-foreground">Notas</span>
									<span className="text-foreground">{transaction.note}</span>
								</li>
							)}
						</ul>

						<ul className="mb-2 grid gap-3">
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
				</div>

				<DialogFooter>
					{onEdit && !transaction.readonly && (
						<Button variant="outline" onClick={handleEdit}>
							Editar
						</Button>
					)}
					<DialogClose asChild>
						<Button type="button">Fechar</Button>
					</DialogClose>
				</DialogFooter>
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
			<span>{value}</span>
		</li>
	);
}
