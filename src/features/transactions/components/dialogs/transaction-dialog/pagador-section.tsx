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
import { PagadorSelectContent } from "../../select-items";
import type { PagadorSectionProps } from "./transaction-dialog-types";

export function PagadorSection({
	formState,
	onFieldChange,
	pagadorOptions,
	secondaryPagadorOptions,
	totalAmount,
}: PagadorSectionProps) {
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
				<Label htmlFor="pagador">Pagador</Label>
				<div className="flex gap-2">
					<Select
						value={formState.pagadorId}
						onValueChange={(value) => onFieldChange("pagadorId", value)}
					>
						<SelectTrigger
							id="pagador"
							className={formState.isSplit ? "w-[55%]" : "w-full"}
						>
							<SelectValue placeholder="Selecione">
								{formState.pagadorId &&
									(() => {
										const selectedOption = pagadorOptions.find(
											(opt) => opt.value === formState.pagadorId,
										);
										return selectedOption ? (
											<PagadorSelectContent
												label={selectedOption.label}
												avatarUrl={selectedOption.avatarUrl}
											/>
										) : null;
									})()}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{pagadorOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<PagadorSelectContent
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
					<Label htmlFor="secondaryPagador">Dividir com</Label>
					<div className="flex gap-2">
						<Select
							value={formState.secondaryPagadorId}
							onValueChange={(value) =>
								onFieldChange("secondaryPagadorId", value)
							}
						>
							<SelectTrigger
								id="secondaryPagador"
								disabled={secondaryPagadorOptions.length === 0}
								className="w-[55%]"
							>
								<SelectValue placeholder="Selecione">
									{formState.secondaryPagadorId &&
										(() => {
											const selectedOption = secondaryPagadorOptions.find(
												(opt) => opt.value === formState.secondaryPagadorId,
											);
											return selectedOption ? (
												<PagadorSelectContent
													label={selectedOption.label}
													avatarUrl={selectedOption.avatarUrl}
												/>
											) : null;
										})()}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{secondaryPagadorOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<PagadorSelectContent
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
