"use client";

import { RiCalculatorLine } from "@remixicon/react";
import { CalculatorDialogButton } from "@/shared/components/calculator/calculator-dialog";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Label } from "@/shared/components/ui/label";
import { EstabelecimentoInput } from "../../shared/establishment-input";
import type { BasicFieldsSectionProps } from "./transaction-dialog-types";

export function BasicFieldsSection({
	formState,
	onFieldChange,
	estabelecimentos,
}: Omit<BasicFieldsSectionProps, "monthOptions">) {
	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<Label htmlFor="name">Estabelecimento</Label>
				<EstabelecimentoInput
					id="name"
					value={formState.name}
					onChange={(value) => onFieldChange("name", value)}
					estabelecimentos={estabelecimentos}
					placeholder="Ex.: Restaurante do Zé"
					maxLength={20}
					required
				/>
			</div>

			<div className="flex w-full flex-col gap-2 md:flex-row">
				<div className="w-full md:w-1/2 space-y-1">
					<Label htmlFor="purchaseDate">Data</Label>
					<DatePicker
						id="purchaseDate"
						value={formState.purchaseDate}
						onChange={(value) => onFieldChange("purchaseDate", value)}
						placeholder="Data"
						required
					/>
				</div>

				<div className="w-full md:w-1/2 space-y-1">
					<Label htmlFor="amount">Valor</Label>
					<div className="relative">
						<CurrencyInput
							id="amount"
							value={formState.amount}
							onValueChange={(value) => onFieldChange("amount", value)}
							placeholder="R$ 0,00"
							required
							className="pr-10"
						/>
						<CalculatorDialogButton
							variant="ghost"
							size="icon-sm"
							className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
							onSelectValue={(value) => onFieldChange("amount", value)}
						>
							<RiCalculatorLine className="h-4 w-4 text-muted-foreground" />
						</CalculatorDialogButton>
					</div>
				</div>
			</div>
		</div>
	);
}
