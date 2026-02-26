"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/ui";
import type { BoletoFieldsSectionProps } from "./lancamento-dialog-types";

export function BoletoFieldsSection({
	formState,
	onFieldChange,
	showPaymentDate,
}: BoletoFieldsSectionProps) {
	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			<div
				className={cn(
					"space-y-1 w-full",
					showPaymentDate ? "md:w-1/2" : "md:w-full",
				)}
			>
				<Label htmlFor="dueDate">Vencimento do boleto</Label>
				<DatePicker
					id="dueDate"
					value={formState.dueDate}
					onChange={(value) => onFieldChange("dueDate", value)}
					placeholder="Selecione o vencimento"
				/>
			</div>
			{showPaymentDate ? (
				<div className="space-y-2 w-full md:w-1/2">
					<Label htmlFor="boletoPaymentDate">Pagamento do boleto</Label>
					<DatePicker
						id="boletoPaymentDate"
						value={formState.boletoPaymentDate}
						onChange={(value) => onFieldChange("boletoPaymentDate", value)}
						placeholder="Selecione a data de pagamento"
					/>
				</div>
			) : null}
		</div>
	);
}
