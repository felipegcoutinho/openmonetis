import {
	RiCheckboxCircleLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import MoneyValues from "@/components/shared/money-values";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import {
	formatInvoicePaymentDate,
	getInvoiceStatusBadgeVariant,
	type InvoiceDialogState,
	parseInvoiceDueDate,
} from "@/lib/dashboard/invoices-helpers";
import { INVOICE_PAYMENT_STATUS, INVOICE_STATUS_LABEL } from "@/lib/faturas";
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
								Pagamento confirmado!
							</DialogTitle>
							<DialogDescription className="text-sm">
								Atualizamos o status da fatura. O lançamento do pagamento
								aparecerá no extrato em instantes.
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
							<DialogTitle>Confirmar pagamento</DialogTitle>
							<DialogDescription>
								Revise os dados antes de confirmar. Vamos registrar a fatura
								como paga.
							</DialogDescription>
						</DialogHeader>

						{invoice ? (
							<div className="space-y-4">
								<div className="rounded-lg border p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<InvoiceLogo
												cardName={invoice.cardName}
												logo={invoice.logo}
												size={40}
												tone="accent"
												containerClassName="size-10"
												fallbackClassName="text-xs"
											/>
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Cartão
												</p>
												<p className="text-lg font-bold text-foreground">
													{invoice.cardName}
												</p>
											</div>
										</div>
										<div className="text-right">
											{invoice.paymentStatus !== INVOICE_PAYMENT_STATUS.PAID ? (
												<p className="text-sm text-muted-foreground">
													{
														parseInvoiceDueDate(invoice.period, invoice.dueDay)
															.label
													}
												</p>
											) : null}
											{invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID &&
											paymentInfo ? (
												<p className="text-sm text-success">
													{paymentInfo.label}
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
											amount={Math.abs(invoice.totalAmount)}
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
											variant={getInvoiceStatusBadgeVariant(
												INVOICE_STATUS_LABEL[invoice.paymentStatus],
											)}
										>
											{INVOICE_STATUS_LABEL[invoice.paymentStatus]}
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
								disabled={isProcessing || !invoice}
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
