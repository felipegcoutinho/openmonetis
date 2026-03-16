"use client";

import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { PayerSelectContent } from "../../select-items";
import type { PayerSectionProps } from "./transaction-dialog-types";

export function PayerSection({
	formState,
	onFieldChange,
	payerOptions,
	secondaryPayerOptions,
	totalAmount,
}: PayerSectionProps) {
	const handlePrimaryAmountChange = (value: string) => {
		onFieldChange("primarySplitAmount", value);
		const numericValue = Number.parseFloat(value) || 0;
		const remaining = Math.max(0, totalAmount - numericValue);
		onFieldChange("secondarySplitAmount", remaining.toFixed(2));
	};

	const handleSecondaryAmountChange = (value: string) => {
		onFieldChange("secondarySplitAmount", value);
		const numericValue = Number.parseFloat(value) || 0;
		const remaining = Math.max(0, totalAmount - numericValue);
		onFieldChange("primarySplitAmount", remaining.toFixed(2));
	};

	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			<div className="w-full space-y-1">
				<Label htmlFor="payer">Pagador</Label>
				<div className="flex gap-2">
					<Select
						value={formState.payerId}
						onValueChange={(value) => onFieldChange("payerId", value)}
					>
						<SelectTrigger
							id="payer"
							className={formState.isSplit ? "min-w-0 flex-1" : "w-full"}
						>
							<SelectValue placeholder="Selecione">
								{formState.payerId &&
									(() => {
										const selectedOption = payerOptions.find(
											(opt) => opt.value === formState.payerId,
										);
										return selectedOption ? (
											<PayerSelectContent
												label={selectedOption.label}
												avatarUrl={selectedOption.avatarUrl}
											/>
										) : null;
									})()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{payerOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<PayerSelectContent
										label={option.label}
										avatarUrl={option.avatarUrl}
									/>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formState.isSplit && (
						<CurrencyInput
							value={formState.primarySplitAmount}
							onValueChange={handlePrimaryAmountChange}
							placeholder="R$ 0,00"
							className="h-9 w-[45%] text-sm"
						/>
					)}
				</div>
			</div>

			{formState.isSplit ? (
				<div className="w-full space-y-1 mb-1">
					<Label htmlFor="secondaryPayer">Dividir com</Label>
					<div className="flex gap-2">
						<Select
							value={formState.secondaryPayerId}
							onValueChange={(value) =>
								onFieldChange("secondaryPayerId", value)
							}
						>
							<SelectTrigger
								id="secondaryPayer"
								disabled={secondaryPayerOptions.length === 0}
								className="w-[55%]"
							>
								<SelectValue placeholder="Selecione">
									{formState.secondaryPayerId &&
										(() => {
											const selectedOption = secondaryPayerOptions.find(
												(opt) => opt.value === formState.secondaryPayerId,
											);
											return selectedOption ? (
												<PayerSelectContent
													label={selectedOption.label}
													avatarUrl={selectedOption.avatarUrl}
												/>
											) : null;
										})()}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{secondaryPayerOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<PayerSelectContent
											label={option.label}
											avatarUrl={option.avatarUrl}
										/>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<CurrencyInput
							value={formState.secondarySplitAmount}
							onValueChange={handleSecondaryAmountChange}
							placeholder="R$ 0,00"
							className="h-9 w-[45%] text-sm"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
