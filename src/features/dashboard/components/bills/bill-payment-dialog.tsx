import {
	RiBarcodeFill,
	RiCheckboxCircleLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
	type BillDialogState,
	formatBillDateLabel,
	getBillStatusBadgeVariant,
} from "@/features/dashboard/bills-helpers";
import type { DashboardBill } from "@/features/dashboard/bills-queries";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";

type BillPaymentDialogProps = {
	bill: DashboardBill | null;
	open: boolean;
	modalState: BillDialogState;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export function BillPaymentDialog({
	bill,
	open,
	modalState,
	isPending,
	onClose,
	onConfirm,
}: BillPaymentDialogProps) {
	const isProcessing = modalState === "processing" || isPending;
	const dueLabel = bill
		? formatBillDateLabel(bill.dueDate, "Vencimento:")
		: null;

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (nextOpen || isProcessing) {
					return;
				}
				onClose();
			}}
		>
			<DialogContent
				className="max-w-[calc(100%-2rem)] sm:max-w-md"
				onEscapeKeyDown={(event) => {
					if (isProcessing) {
						event.preventDefault();
					}
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
						<DialogFooter className="sm:justify-center">
							<Button type="button" onClick={onClose} className="sm:w-auto">
								Fechar
							</Button>
						</DialogFooter>
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Confirmar pagamento do boleto</DialogTitle>
							<DialogDescription>
								Confirme os dados para registrar o pagamento. Você poderá editar
								o lançamento depois, se necessário.
							</DialogDescription>
						</DialogHeader>

						{bill ? (
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
													{bill.name}
												</p>
											</div>
										</div>
										{dueLabel ? (
											<div className="text-right">
												<p className="text-sm text-muted-foreground">
													{dueLabel}
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
											amount={bill.amount}
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
											variant={getBillStatusBadgeVariant(
												bill.isSettled ? "Pago" : "Pendente",
											)}
										>
											{bill.isSettled ? "Pago" : "Pendente"}
										</Badge>
									</div>
								</div>
							</div>
						) : null}

						<DialogFooter className="sm:justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isProcessing}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={onConfirm}
								disabled={isProcessing || !bill || bill.isSettled}
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
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
