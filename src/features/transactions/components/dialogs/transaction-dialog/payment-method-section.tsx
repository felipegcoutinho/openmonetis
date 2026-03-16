"use client";

import { useState } from "react";
import { PAYMENT_METHODS } from "@/features/transactions/constants";
import { Label } from "@/shared/components/ui/label";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	dateToPeriod,
	displayPeriod,
	periodToDate,
} from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";
import {
	AccountCardSelectContent,
	PaymentMethodSelectContent,
} from "../../select-items";
import type { PaymentMethodSectionProps } from "./transaction-dialog-types";

function InlinePeriodPicker({
	period,
	onPeriodChange,
}: {
	period: string;
	onPeriodChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div className="ml-1">
			<span className="text-xs text-muted-foreground">Fatura de </span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="cursor-pointer text-xs text-primary underline-offset-2 hover:underline lowercase"
					>
						{displayPeriod(period)}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<MonthPicker
						selectedMonth={periodToDate(period)}
						onMonthSelect={(date) => {
							onPeriodChange(dateToPeriod(date));
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export function PaymentMethodSection({
	formState,
	onFieldChange,
	accountOptions,
	cardOptions,
	isUpdateMode,
	disablePaymentMethod,
	disableCardSelect,
}: PaymentMethodSectionProps) {
	const isCartaoSelected = formState.paymentMethod === "Cartão de crédito";
	const showContaSelect = [
		"Pix",
		"Dinheiro",
		"Boleto",
		"Cartão de débito",
		"Pré-Pago | VR/VA",
		"Transferência bancária",
	].includes(formState.paymentMethod);

	const filteredContaOptions =
		formState.paymentMethod === "Pré-Pago | VR/VA"
			? accountOptions.filter(
					(option) => option.accountType === "Pré-Pago | VR/VA",
				)
			: accountOptions;

	const hasSecondaryColumn = isCartaoSelected || showContaSelect;

	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			{!isUpdateMode ? (
				<div
					className={cn(
						"w-full space-y-1",
						hasSecondaryColumn ? "md:w-1/2" : "md:w-full",
					)}
				>
					<Label htmlFor="paymentMethod">Forma de pagamento</Label>
					<Select
						value={formState.paymentMethod}
						onValueChange={(value) => onFieldChange("paymentMethod", value)}
						disabled={disablePaymentMethod}
					>
						<SelectTrigger
							id="paymentMethod"
							className="w-full"
							disabled={disablePaymentMethod}
						>
							<SelectValue placeholder="Selecione" className="w-full">
								{formState.paymentMethod && (
									<PaymentMethodSelectContent label={formState.paymentMethod} />
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{PAYMENT_METHODS.map((method) => (
								<SelectItem key={method} value={method}>
									<PaymentMethodSelectContent label={method} />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}

			{isCartaoSelected ? (
				<div
					className={cn(
						"w-full space-y-1",
						!isUpdateMode ? "md:w-1/2" : "md:w-full",
					)}
				>
					<Label htmlFor="cartao">Cartão</Label>
					<Select
						value={formState.cardId}
						onValueChange={(value) => onFieldChange("cardId", value)}
						disabled={disableCardSelect}
					>
						<SelectTrigger
							id="cartao"
							className="w-full"
							disabled={disableCardSelect}
						>
							<SelectValue placeholder="Selecione">
								{formState.cardId &&
									(() => {
										const selectedOption = cardOptions.find(
											(opt) => opt.value === formState.cardId,
										);
										return selectedOption ? (
											<AccountCardSelectContent
												label={selectedOption.label}
												logo={selectedOption.logo}
												isCartao={true}
											/>
										) : null;
									})()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{cardOptions.length === 0 ? (
								<div className="px-2 py-6 text-center">
									<p className="text-sm text-muted-foreground">
										Nenhum cartão cadastrado
									</p>
								</div>
							) : (
								cardOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<AccountCardSelectContent
											label={option.label}
											logo={option.logo}
											isCartao={true}
										/>
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
					{formState.cardId ? (
						<InlinePeriodPicker
							period={formState.period}
							onPeriodChange={(value) => onFieldChange("period", value)}
						/>
					) : null}
				</div>
			) : null}

			{!isCartaoSelected && showContaSelect ? (
				<div
					className={cn(
						"w-full space-y-1",
						!isUpdateMode ? "md:w-1/2" : "md:w-full",
					)}
				>
					<Label htmlFor="conta">Conta</Label>
					<Select
						value={formState.accountId}
						onValueChange={(value) => onFieldChange("accountId", value)}
					>
						<SelectTrigger id="conta" className="w-full">
							<SelectValue placeholder="Selecione">
								{formState.accountId &&
									(() => {
										const selectedOption = filteredContaOptions.find(
											(opt) => opt.value === formState.accountId,
										);
										return selectedOption ? (
											<AccountCardSelectContent
												label={selectedOption.label}
												logo={selectedOption.logo}
												isCartao={false}
											/>
										) : null;
									})()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{filteredContaOptions.length === 0 ? (
								<div className="px-2 py-6 text-center">
									<p className="text-sm text-muted-foreground">
										Nenhuma conta cadastrada
									</p>
								</div>
							) : (
								filteredContaOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<AccountCardSelectContent
											label={option.label}
											logo={option.logo}
											isCartao={false}
										/>
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</div>
	);
}
