"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTransactionAction } from "@/features/transactions/actions";
import { groupAndSortCategories } from "@/features/transactions/category-helpers";
import { Button } from "@/shared/components/ui/button";
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
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	AccountCardSelectContent,
	CategorySelectContent,
	PayerSelectContent,
} from "../select-items";
import type { SelectOption, TransactionItem } from "../types";

interface BulkImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: TransactionItem[];
	payerOptions: SelectOption[];
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	defaultPayerId?: string | null;
}

export function BulkImportDialog({
	open,
	onOpenChange,
	items,
	payerOptions,
	accountOptions,
	cardOptions,
	categoryOptions,
	defaultPayerId,
}: BulkImportDialogProps) {
	const [payerId, setPagadorId] = useState<string | undefined>(
		defaultPayerId ?? undefined,
	);
	const [categoryId, setCategoriaId] = useState<string | undefined>(undefined);
	const [accountId, setContaId] = useState<string | undefined>(undefined);
	const [cardId, setCartaoId] = useState<string | undefined>(undefined);
	const [isPending, startTransition] = useTransition();
	type CreateTransactionInput = Parameters<typeof createTransactionAction>[0];

	// Reset form when dialog opens/closes
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setPagadorId(defaultPayerId ?? undefined);
			setCategoriaId(undefined);
			setContaId(undefined);
			setCartaoId(undefined);
		}
		onOpenChange(newOpen);
	};

	const categoryGroups = useMemo(() => {
		// Get unique transaction types from items
		const transactionTypes = new Set(items.map((item) => item.transactionType));

		// Filter categories based on transaction types
		const filtered = categoryOptions.filter((option) => {
			if (!option.group) return false;
			return Array.from(transactionTypes).some(
				(type) => option.group?.toLowerCase() === type.toLowerCase(),
			);
		});

		return groupAndSortCategories(filtered);
	}, [categoryOptions, items]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!payerId) {
			toast.error("Selecione a pessoa.");
			return;
		}

		if (!categoryId) {
			toast.error("Selecione a categoria.");
			return;
		}

		startTransition(async () => {
			let successCount = 0;
			let errorCount = 0;

			for (const item of items) {
				const sanitizedAmount = Math.abs(item.amount);

				// Determine payment method based on original item
				const isCredit = item.paymentMethod === "Cartão de crédito";

				// Validate payment method fields
				if (isCredit && !cardId) {
					toast.error("Selecione um cartão de crédito.");
					return;
				}

				if (!isCredit && !accountId) {
					toast.error("Selecione uma conta.");
					return;
				}

				const payload: CreateTransactionInput = {
					purchaseDate: item.purchaseDate,
					period: item.period,
					name: item.name,
					transactionType:
						item.transactionType as CreateTransactionInput["transactionType"],
					amount: sanitizedAmount,
					condition: item.condition as CreateTransactionInput["condition"],
					paymentMethod:
						item.paymentMethod as CreateTransactionInput["paymentMethod"],
					payerId: payerId ?? null,
					secondaryPayerId: undefined,
					isSplit: false,
					accountId: isCredit ? null : (accountId ?? null),
					cardId: isCredit ? (cardId ?? null) : null,
					categoryId: categoryId ?? null,
					note: item.note ?? null,
					isSettled: isCredit ? null : Boolean(item.isSettled),
					installmentCount:
						item.condition === "Parcelado" && item.installmentCount
							? Number(item.installmentCount)
							: undefined,
					recurrenceCount:
						item.condition === "Recorrente" && item.recurrenceCount
							? Number(item.recurrenceCount)
							: undefined,
					dueDate:
						item.paymentMethod === "Boleto" && item.dueDate
							? item.dueDate
							: undefined,
				};

				const result = await createTransactionAction(payload);

				if (result.success) {
					successCount++;
				} else {
					errorCount++;
					console.error(`Failed to import ${item.name}:`, result.error);
				}
			}

			if (errorCount === 0) {
				toast.success(
					`${successCount} ${
						successCount === 1
							? "lançamento importado"
							: "lançamentos importados"
					} com sucesso!`,
				);
				handleOpenChange(false);
			} else if (successCount > 0) {
				toast.warning(
					`${successCount} importados, ${errorCount} falharam. Verifique o console para detalhes.`,
				);
			} else {
				toast.error("Falha ao importar lançamentos. Verifique o console.");
			}
		});
	};

	const itemCount = items.length;
	const hasCredit = items.some(
		(item) => item.paymentMethod === "Cartão de crédito",
	);
	const hasNonCredit = items.some(
		(item) => item.paymentMethod !== "Cartão de crédito",
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Importar Lançamentos</DialogTitle>
					<DialogDescription>
						Importando {itemCount}{" "}
						{itemCount === 1 ? "lançamento" : "lançamentos"}. Selecione o
						pessoa, categoria e forma de pagamento para aplicar a todos.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="pagador">Pessoa *</Label>
						<Select value={payerId} onValueChange={setPagadorId}>
							<SelectTrigger id="pagador" className="w-full">
								<SelectValue placeholder="Selecione a pessoa">
									{payerId &&
										(() => {
											const selectedOption = payerOptions.find(
												(opt) => opt.value === payerId,
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
					</div>

					<div className="space-y-2">
						<Label htmlFor="categoria">Categoria *</Label>
						<Select value={categoryId} onValueChange={setCategoriaId}>
							<SelectTrigger id="categoria" className="w-full">
								<SelectValue placeholder="Selecione a categoria">
									{categoryId &&
										(() => {
											const selectedOption = categoryOptions.find(
												(opt) => opt.value === categoryId,
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

					{hasNonCredit && (
						<div className="space-y-2">
							<Label htmlFor="conta">
								Conta {hasCredit ? "(para não cartão)" : "*"}
							</Label>
							<Select value={accountId} onValueChange={setContaId}>
								<SelectTrigger id="conta" className="w-full">
									<SelectValue placeholder="Selecione a conta">
										{accountId &&
											(() => {
												const selectedOption = accountOptions.find(
													(opt) => opt.value === accountId,
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
									{accountOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<AccountCardSelectContent
												label={option.label}
												logo={option.logo}
												isCartao={false}
											/>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{hasCredit && (
						<div className="space-y-2">
							<Label htmlFor="cartao">
								Cartão {hasNonCredit ? "(para cartão de crédito)" : "*"}
							</Label>
							<Select value={cardId} onValueChange={setCartaoId}>
								<SelectTrigger id="cartao" className="w-full">
									<SelectValue placeholder="Selecione o cartão">
										{cardId &&
											(() => {
												const selectedOption = cardOptions.find(
													(opt) => opt.value === cardId,
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
									{cardOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<AccountCardSelectContent
												label={option.label}
												logo={option.logo}
												isCartao={true}
											/>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Importando..." : "Importar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
