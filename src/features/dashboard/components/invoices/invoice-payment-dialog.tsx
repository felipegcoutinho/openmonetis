import {
	RiBankCardLine,
	RiCalendarLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
	formatInvoicePaymentDate,
	getInvoiceStatusBadgeVariant,
	type InvoiceDialogState,
	parseInvoiceDueDate,
} from "@/features/dashboard/invoices-helpers";
import type { DashboardInvoice } from "@/features/dashboard/invoices-queries";
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
import {
	INVOICE_PAYMENT_STATUS,
	INVOICE_STATUS_LABEL,
} from "@/shared/lib/invoices";
import { InvoiceLogo } from "./invoice-logo";

type InvoicePaymentDialogProps = {
	invoice: DashboardInvoice | null;
	open: boolean;
	modalState: InvoiceDialogState;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export function InvoicePaymentDialog({
	invoice,
	open,
	modalState,
	isPending,
	onClose,
	onConfirm,
}: InvoicePaymentDialogProps) {
	const isProcessing = modalState === "processing" || isPending;
	const paymentInfo = invoice ? formatInvoicePaymentDate(invoice.paidAt) : null;
	const dueInfo = invoice
		? parseInvoiceDueDate(invoice.period, invoice.dueDay)
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
						title="Pagamento confirmado!"
						description="Atualizamos o status da fatura. O lançamento do pagamento aparecerá no extrato em instantes."
						onClose={onClose}
					/>
				) : (
					<>
						<DialogHeader>
							<div className="mb-1 flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
									<RiBankCardLine className="size-5 text-primary" />
								</div>
								<div>
									<DialogTitle>Confirmar pagamento</DialogTitle>
									<DialogDescription className="mt-0.5 text-xs">
										Fatura do cartão
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						{invoice ? (
							<div className="space-y-3">
								{/* Card principal */}
								<div className="flex items-center gap-3 rounded-xl border p-4">
									<InvoiceLogo
										cardName={invoice.cardName}
										logo={invoice.logo}
										size={36}
										tone="accent"
										containerClassName="size-9 shrink-0"
										fallbackClassName="text-xs"
									/>
									<div className="min-w-0">
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Cartão
										</p>
										<p className="truncate text-base font-semibold text-foreground">
											{invoice.cardName}
										</p>
									</div>
								</div>

								{/* Métricas */}
								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-xl border p-3">
										<div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
											<RiMoneyDollarCircleLine className="size-3.5" />
											<span className="text-xs font-medium uppercase tracking-wide">
												Total da fatura
											</span>
										</div>
										<MoneyValues
											amount={Math.abs(invoice.totalAmount)}
											className="text-lg font-semibold"
										/>
									</div>

									<div className="rounded-xl border p-3">
										<div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
											<RiCalendarLine className="size-3.5" />
											<span className="text-xs font-medium uppercase tracking-wide">
												{invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID
													? "Pago em"
													: "Vencimento"}
											</span>
										</div>
										<p className="text-sm font-medium text-foreground">
											{invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID
												? (paymentInfo?.label ?? "—")
												: (dueInfo?.label ?? "—")}
										</p>
									</div>
								</div>

								{/* Status */}
								<div className="flex items-center justify-between rounded-xl border p-3">
									<span className="text-sm text-muted-foreground">
										Status atual
									</span>
									<Badge
										variant={getInvoiceStatusBadgeVariant(
											INVOICE_STATUS_LABEL[invoice.paymentStatus],
										)}
									>
										{INVOICE_STATUS_LABEL[invoice.paymentStatus]}
									</Badge>
								</div>

								{/* Aviso */}
								<p className="px-1 text-xs text-muted-foreground">
									Vamos registrar a fatura como paga. Você poderá editar depois
									se necessário.
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
								disabled={isProcessing || !invoice}
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
