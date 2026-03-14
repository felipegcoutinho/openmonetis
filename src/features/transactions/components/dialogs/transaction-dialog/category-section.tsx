"use client";

import { TRANSACTION_TYPES } from "@/features/transactions/constants";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/ui";
import {
	CategorySelectContent,
	TransactionTypeSelectContent,
} from "../../select-items";
import type { CategorySectionProps } from "./transaction-dialog-types";

export function CategorySection({
	formState,
	onFieldChange,
	categoryOptions,
	categoryGroups,
	isUpdateMode,
	hideTransactionType = false,
}: CategorySectionProps) {
	const showTransactionTypeField = !isUpdateMode && !hideTransactionType;

	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			{showTransactionTypeField ? (
				<div className="w-full space-y-1 md:w-1/2">
					<Label htmlFor="transactionType">Tipo de transação</Label>
					<Select
						value={formState.transactionType}
						onValueChange={(value) => onFieldChange("transactionType", value)}
					>
						<SelectTrigger id="transactionType" className="w-full">
							<SelectValue placeholder="Selecione">
								{formState.transactionType && (
									<TransactionTypeSelectContent
										label={formState.transactionType}
									/>
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{TRANSACTION_TYPES.filter((type) => type !== "Transferência").map(
								(type) => (
									<SelectItem key={type} value={type}>
										<TransactionTypeSelectContent label={type} />
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>
			) : null}

			<div
				className={cn(
					"space-y-1 w-full",
					showTransactionTypeField ? "md:w-1/2" : "md:w-full",
				)}
			>
				<Label htmlFor="categoria">Categoria</Label>
				<Select
					value={formState.categoryId}
					onValueChange={(value) => onFieldChange("categoryId", value)}
				>
					<SelectTrigger id="categoria" className="w-full">
						<SelectValue placeholder="Selecione">
							{formState.categoryId &&
								(() => {
									const selectedOption = categoryOptions.find(
										(opt) => opt.value === formState.categoryId,
									);
									return selectedOption ? (
										<CategorySelectContent
											label={selectedOption.label}
											icon={selectedOption.icon}
										/>
									) : null;
								})()}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{categoryGroups.map((group) => (
							<SelectGroup key={group.label}>
								<SelectLabel>{group.label}</SelectLabel>
								{group.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<CategorySelectContent
											label={option.label}
											icon={option.icon}
										/>
									</SelectItem>
								))}
							</SelectGroup>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
