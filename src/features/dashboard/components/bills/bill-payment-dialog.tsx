import {
	RiBarcodeFill,
	RiCalendarLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
	type BillDialogState,
	formatBillDateLabel,
	getBillStatusBadgeVariant,
} from "@/features/dashboard/bills/bills-helpers";
import type { DashboardBill } from "@/features/dashboard/bills/bills-queries";
import MoneyValues from "@/shared/components/money-values";
import { PaymentSuccess } from "@/shared/components/payment-success";
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
				className="max-w-[calc(100%-2rem)] sm:max-w-md sm:p-8"
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
					<PaymentSuccess
						title="Pagamento registrado!"
						description="Atualizamos o status do boleto para pago. Em instantes ele aparecerá como baixado no histórico."
						onClose={onClose}
					/>
				) : (
					<>
						<DialogHeader>
							<div className="mb-1 flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
									<RiBarcodeFill className="size-5 text-primary" />
								</div>
								<div>
									<DialogTitle>Confirmar pagamento</DialogTitle>
									<DialogDescription className="mt-0.5 text-xs">
										Boleto
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						{bill ? (
							<div className="space-y-3">
								{/* Card principal */}
								<div className="rounded-xl border p-3">
									<p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
										Boleto
									</p>
									<p className="text-base font-semibold text-foreground">
										{bill.name}
									</p>
								</div>

								{/* Métricas */}
								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-xl border p-3">
										<div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
											<RiMoneyDollarCircleLine className="size-3.5" />
											<span className="text-xs font-medium uppercase tracking-wide">
												Valor
											</span>
										</div>
										<MoneyValues
											amount={bill.amount}
											className="text-lg font-semibold"
										/>
									</div>

									<div className="rounded-xl border p-3">
										<div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
											<RiCalendarLine className="size-3.5" />
											<span className="text-xs font-medium uppercase tracking-wide">
												Vencimento
											</span>
										</div>
										<p className="text-sm font-medium text-foreground">
											{dueLabel?.replace("Vencimento: ", "") ?? "—"}
										</p>
									</div>
								</div>

								{/* Status */}
								<div className="flex items-center justify-between rounded-xl border p-3">
									<span className="text-sm text-muted-foreground">
										Status atual
									</span>
									<Badge
										variant={getBillStatusBadgeVariant(
											bill.isSettled ? "Pago" : "Pendente",
										)}
									>
										{bill.isSettled ? "Pago" : "Pendente"}
									</Badge>
								</div>

								{/* Aviso */}
								<p className="px-1 text-xs text-muted-foreground">
									Você poderá editar o lançamento depois, se necessário.
								</p>
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
