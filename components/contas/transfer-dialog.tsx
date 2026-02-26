"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { transferBetweenAccountsAction } from "@/app/(dashboard)/contas/actions";
import type { AccountData } from "@/app/(dashboard)/contas/data";
import { ContaCartaoSelectContent } from "@/components/lancamentos/select-items";
import { PeriodPicker } from "@/components/period-picker";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useControlledState } from "@/hooks/use-controlled-state";
import { getTodayDateString } from "@/lib/utils/date";

interface TransferDialogProps {
	trigger?: React.ReactNode;
	accounts: AccountData[];
	fromAccountId: string;
	currentPeriod: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function TransferDialog({
	trigger,
	accounts,
	fromAccountId,
	currentPeriod,
	open,
	onOpenChange,
}: TransferDialogProps) {
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Form state
	const [toAccountId, setToAccountId] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(getTodayDateString());
	const [period, setPeriod] = useState(currentPeriod);

	// Available destination accounts (exclude source account)
	const availableAccounts = accounts.filter(
		(account) => account.id !== fromAccountId,
	);

	// Source account info
	const fromAccount = accounts.find((account) => account.id === fromAccountId);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);

		if (!toAccountId) {
			setErrorMessage("Selecione a conta de destino.");
			return;
		}

		if (toAccountId === fromAccountId) {
			setErrorMessage("Selecione uma conta de destino diferente da origem.");
			return;
		}

		if (!amount || parseFloat(amount.replace(",", ".")) <= 0) {
			setErrorMessage("Informe um valor válido maior que zero.");
			return;
		}

		startTransition(async () => {
			const result = await transferBetweenAccountsAction({
				fromAccountId,
				toAccountId,
				amount,
				date: new Date(date),
				period,
			});

			if (result.success) {
				toast.success(result.message);
				setDialogOpen(false);
				// Reset form
				setToAccountId("");
				setAmount("");
				setDate(getTodayDateString());
				setPeriod(currentPeriod);
				return;
			}

			setErrorMessage(result.error);
			toast.error(result.error);
		});
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Transferir entre contas</DialogTitle>
					<DialogDescription>
						Registre uma transferência de valores entre suas contas.
					</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="transfer-date">Data da transferência</Label>
							<DatePicker
								id="transfer-date"
								value={date}
								onChange={setDate}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="transfer-period">Período</Label>
							<PeriodPicker
								value={period}
								onChange={setPeriod}
								className="w-full"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor="transfer-amount">Valor</Label>
							<CurrencyInput
								id="transfer-amount"
								value={amount}
								onValueChange={setAmount}
								placeholder="R$ 0,00"
								required
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor="from-account">Conta de origem</Label>
							<Select value={fromAccountId} disabled>
								<SelectTrigger id="from-account" className="w-full">
									<SelectValue>
										{fromAccount && (
											<ContaCartaoSelectContent
												label={fromAccount.name}
												logo={fromAccount.logo}
												isCartao={false}
											/>
										)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{fromAccount && (
										<SelectItem value={fromAccount.id}>
											<ContaCartaoSelectContent
												label={fromAccount.name}
												logo={fromAccount.logo}
												isCartao={false}
											/>
										</SelectItem>
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor="to-account">Conta de destino</Label>
							{availableAccounts.length === 0 ? (
								<div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
									É necessário ter mais de uma conta cadastrada para realizar
									transferências.
								</div>
							) : (
								<Select value={toAccountId} onValueChange={setToAccountId}>
									<SelectTrigger id="to-account" className="w-full">
										<SelectValue placeholder="Selecione a conta de destino">
											{toAccountId &&
												(() => {
													const selectedAccount = availableAccounts.find(
														(acc) => acc.id === toAccountId,
													);
													return selectedAccount ? (
														<ContaCartaoSelectContent
															label={selectedAccount.name}
															logo={selectedAccount.logo}
															isCartao={false}
														/>
													) : null;
												})()}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="w-full">
										{availableAccounts.map((account) => (
											<SelectItem key={account.id} value={account.id}>
												<ContaCartaoSelectContent
													label={account.name}
													logo={account.logo}
													isCartao={false}
												/>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>

					{errorMessage && (
						<p className="text-sm text-destructive">{errorMessage}</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isPending || availableAccounts.length === 0}
						>
							{isPending ? "Processando..." : "Confirmar transferência"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
