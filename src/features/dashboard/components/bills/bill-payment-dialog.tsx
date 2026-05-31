import {
	RiCalendarLine,
	RiLoader4Line,
	RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
	type BillDialogState,
	formatBillDateLabel,
	getBillStatusBadgeVariant,
	isIncomeBill,
} from "@/features/dashboard/bills/bills-helpers";
import type {
	BillPaymentAccountOption,
	DashboardBill,
} from "@/features/dashboard/bills/bills-queries";
import { AccountCardSelectContent } from "@/features/transactions/components/select-items";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import { PaymentSuccess } from "@/shared/components/feedback/payment-success";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";

type BillPaymentDialogProps = {
	bill: DashboardBill | null;
	open: boolean;
	modalState: BillDialogState;
	isPending: boolean;
	paymentAccountId: string;
	onPaymentAccountChange: (accountId: string) => void;
	paymentDate: Date;
	onPaymentDateChange: (date: Date) => void;
	paymentAccountOptions: BillPaymentAccountOption[];
	onClose: () => void;
	onConfirm: () => void;
};

export function BillPaymentDialog({
	bill,
	open,
	modalState,
	isPending,
	paymentAccountId,
	onPaymentAccountChange,
	paymentDate,
	onPaymentDateChange,
	paymentAccountOptions,
	onClose,
	onConfirm,
}: BillPaymentDialogProps) {
	const isProcessing = modalState === "processing" || isPending;
	const income = bill ? isIncomeBill(bill) : false;
	const settlementLabel = income ? "Recebido" : "Pago";
	const dueLabel = bill
		? formatBillDateLabel(bill.dueDate, "Vencimento:")
		: null;
	const paidLabel = bill
		? formatBillDateLabel(bill.boletoPaymentDate, `${settlementLabel} em:`)
		: null;
	const isBillPending = bill ? !bill.isSettled : false;
	const paymentDateValue = paymentDate.toISOString().split("T")[0] ?? "";
	const selectedAccount = paymentAccountOptions.find(
		(option) => option.value === paymentAccountId,
	);

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
						title={income ? "Recebimento registrado!" : "Pagamento registrado!"}
						description={`Atualizamos o status do boleto para ${income ? "recebido" : "pago"}. Em instantes ele aparecerá como baixado no histórico.`}
						onClose={onClose}
					/>
				) : (
					<>
						<DialogHeader>
							<div className="mb-1 flex items-center gap-3">
								<div>
									<DialogTitle>
										{income ? "Confirmar recebimento" : "Confirmar pagamento"}
									</DialogTitle>
									<DialogDescription className="mt-1 text-xs">
										{isBillPending
											? `Escolha a conta de ${income ? "destino" : "origem"} e a data em que o boleto foi ${income ? "recebido" : "pago"}.`
											: "Boleto"}
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						{bill ? (
							<div className="space-y-3">
								<Card className="flex flex-row items-start gap-2 p-4">
									<EstablishmentLogo
										name={bill.name}
										size={36}
										className="size-9 shrink-0"
									/>
									<div className="min-w-0">
										<p className="text-xs font-medium text-muted-foreground uppercase">
											Boleto
										</p>
										<p className="truncate text-base font-semibold text-foreground">
											{bill.name}
										</p>
									</div>
								</Card>

								<div className="grid grid-cols-2 gap-3">
									<Card className="p-3">
										<div className="flex items-center gap-1.5 text-muted-foreground">
											<RiMoneyDollarCircleLine className="size-3.5" />
											<span className="text-xs font-medium uppercase">
												Valor
											</span>
										</div>
										<MoneyValues
											amount={bill.amount}
											className="text-xl font-semibold"
										/>
									</Card>

									<Card className="p-3">
										<div className="flex items-center gap-1.5 text-muted-foreground">
											<RiCalendarLine className="size-3.5" />
											<span className="text-xs font-medium uppercase">
												{bill.isSettled
													? `${settlementLabel} em`
													: "Vencimento"}
											</span>
										</div>
										<p className="font-semibold">
											{bill.isSettled
												? (paidLabel?.replace(`${settlementLabel} em: `, "") ??
													"—")
												: (dueLabel?.replace("Vencimento: ", "") ?? "—")}
										</p>
									</Card>
								</div>

								<Separator />

								{isBillPending ? (
									<div className="space-y-3">
										<div className="space-y-2">
											<Label htmlFor="bill-widget-payment-account">
												Conta de {income ? "recebimento" : "pagamento"}
											</Label>
											<Select
												value={paymentAccountId}
												onValueChange={onPaymentAccountChange}
												disabled={
													isProcessing || paymentAccountOptions.length === 0
												}
											>
												<SelectTrigger
													id="bill-widget-payment-account"
													className="w-full"
												>
													<SelectValue placeholder="Selecione uma conta">
														{selectedAccount ? (
															<AccountCardSelectContent
																label={selectedAccount.label}
																logo={selectedAccount.logo}
															/>
														) : null}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{paymentAccountOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<AccountCardSelectContent
																label={option.label}
																logo={option.logo}
															/>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="bill-widget-payment-date">
												Data do {income ? "recebimento" : "pagamento"}
											</Label>
											<DatePicker
												id="bill-widget-payment-date"
												value={paymentDateValue}
												onChange={(value) => {
													if (value) {
														onPaymentDateChange(new Date(`${value}T00:00:00`));
													}
												}}
												disabled={isProcessing}
											/>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-between rounded-xl border p-3">
										<span className="text-sm text-muted-foreground">
											Status atual
										</span>
										<Badge variant={getBillStatusBadgeVariant(settlementLabel)}>
											{settlementLabel}
										</Badge>
									</div>
								)}
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
								disabled={
									isProcessing ||
									!bill ||
									bill.isSettled ||
									(isBillPending &&
										(!paymentAccountId || paymentAccountOptions.length === 0))
								}
							>
								{isProcessing ? (
									<>
										<RiLoader4Line className="mr-1.5 size-4 animate-spin" />
										Processando...
									</>
								) : (
									"Confirmar"
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
