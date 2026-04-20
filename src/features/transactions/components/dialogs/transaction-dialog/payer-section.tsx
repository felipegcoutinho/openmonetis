"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { RiSliceFill } from "@remixicon/react";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/ui";
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
		<div className="space-y-3">
			<div
				className={cn(
					"flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
					formState.isSplit
						? "border-primary/20 bg-primary/5"
						: "border-border bg-transparent",
				)}
			>
				<div className="flex items-center gap-2">
					<div>
						<p className="text-sm text-foreground">Dividir lançamento</p>
						<p className="text-xs text-muted-foreground">
							Atribuir parte do valor a outra pessoa.
						</p>
					</div>
				</div>
				<CheckboxPrimitive.Root
					checked={formState.isSplit}
					onCheckedChange={(checked) =>
						onFieldChange("isSplit", Boolean(checked))
					}
					aria-label="Dividir lançamento"
					className={cn(
						"peer size-4 shrink-0 rounded-lg border shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
						formState.isSplit
							? "border-primary bg-primary text-primary-foreground"
							: "border-input dark:bg-input/30",
					)}
				>
					<CheckboxPrimitive.Indicator className="grid place-content-center text-current transition-none">
						<RiSliceFill className="size-3" />
					</CheckboxPrimitive.Indicator>
				</CheckboxPrimitive.Root>
			</div>

			<div className="flex w-full flex-col gap-2 md:flex-row">
				<div className="w-full space-y-1">
					<Label htmlFor="payer">Pessoa</Label>
					<div className="flex gap-2">
						<Select
							value={formState.payerId ?? ""}
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
								value={formState.secondaryPayerId ?? ""}
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
		</div>
	);
}
