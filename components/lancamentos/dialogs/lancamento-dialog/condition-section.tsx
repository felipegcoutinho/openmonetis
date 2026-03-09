"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANCAMENTO_CONDITIONS } from "@/lib/lancamentos/constants";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { ConditionSelectContent } from "../../select-items";
import type { ConditionSectionProps } from "./lancamento-dialog-types";

export function ConditionSection({
	formState,
	onFieldChange,
	showInstallments,
	showRecurrence,
}: ConditionSectionProps) {
	const parsedAmount = Number(formState.amount);
	const amount =
		Number.isNaN(parsedAmount) || parsedAmount <= 0 ? null : parsedAmount;

	const getInstallmentLabel = (count: number) => {
		if (amount) {
			const installmentValue = amount / count;
			return `${count}x de R$ ${formatCurrency(installmentValue)}`;
		}

		return `${count}x`;
	};

	const installmentCount = Number(formState.installmentCount);
	const installmentSummary =
		showInstallments &&
		formState.installmentCount &&
		amount &&
		!Number.isNaN(installmentCount) &&
		installmentCount > 0
			? getInstallmentLabel(installmentCount)
			: null;

	const recurrenceCount = Number(formState.recurrenceCount);
	const recurrenceSummary =
		showRecurrence &&
		formState.recurrenceCount &&
		!Number.isNaN(recurrenceCount) &&
		recurrenceCount > 0
			? `Por ${recurrenceCount} meses`
			: null;

	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			<div
				className={cn(
					"space-y-1 w-full",
					showInstallments || showRecurrence ? "md:w-1/2" : "md:w-full",
				)}
			>
				<Label htmlFor="condition">Condição</Label>
				<Select
					value={formState.condition}
					onValueChange={(value) => onFieldChange("condition", value)}
				>
					<SelectTrigger id="condition" className="w-full">
						<SelectValue placeholder="Selecione">
							{formState.condition && (
								<ConditionSelectContent label={formState.condition} />
							)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{LANCAMENTO_CONDITIONS.map((condition) => (
							<SelectItem key={condition} value={condition}>
								<ConditionSelectContent label={condition} />
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{showInstallments ? (
				<div className="space-y-1 w-full md:w-1/2">
					<Label htmlFor="installmentCount">Parcelado em</Label>
					<Select
						value={formState.installmentCount}
						onValueChange={(value) => onFieldChange("installmentCount", value)}
					>
						<SelectTrigger id="installmentCount" className="w-full">
							<SelectValue placeholder="Selecione">
								{installmentSummary}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{[...Array(24)].map((_, index) => {
								const count = index + 2;
								return (
									<SelectItem key={count} value={String(count)}>
										{getInstallmentLabel(count)}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			) : null}

			{showRecurrence ? (
				<div className="space-y-1 w-full md:w-1/2">
					<Label htmlFor="recurrenceCount">Repetirá</Label>
					<Select
						value={formState.recurrenceCount}
						onValueChange={(value) => onFieldChange("recurrenceCount", value)}
					>
						<SelectTrigger id="recurrenceCount" className="w-full">
							<SelectValue placeholder="Selecione">
								{recurrenceSummary}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{[...Array(47)].map((_, index) => (
								<SelectItem key={index + 2} value={String(index + 2)}>
									{index + 2} meses
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</div>
	);
}
