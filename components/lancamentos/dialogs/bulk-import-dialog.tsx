"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createLancamentoAction } from "@/app/(dashboard)/lancamentos/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { groupAndSortCategorias } from "@/lib/lancamentos/categoria-helpers";
import {
	CategoriaSelectContent,
	ContaCartaoSelectContent,
	PagadorSelectContent,
} from "../select-items";
import type { LancamentoItem, SelectOption } from "../types";

interface BulkImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: LancamentoItem[];
	pagadorOptions: SelectOption[];
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	categoriaOptions: SelectOption[];
	defaultPagadorId?: string | null;
}

export function BulkImportDialog({
	open,
	onOpenChange,
	items,
	pagadorOptions,
	contaOptions,
	cartaoOptions,
	categoriaOptions,
	defaultPagadorId,
}: BulkImportDialogProps) {
	const [pagadorId, setPagadorId] = useState<string | undefined>(
		defaultPagadorId ?? undefined,
	);
	const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
	const [contaId, setContaId] = useState<string | undefined>(undefined);
	const [cartaoId, setCartaoId] = useState<string | undefined>(undefined);
	const [isPending, startTransition] = useTransition();

	// Reset form when dialog opens/closes
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) {
				setPagadorId(defaultPagadorId ?? undefined);
				setCategoriaId(undefined);
				setContaId(undefined);
				setCartaoId(undefined);
			}
			onOpenChange(newOpen);
		},
		[onOpenChange, defaultPagadorId],
	);

	const categoriaGroups = useMemo(() => {
		// Get unique transaction types from items
		const transactionTypes = new Set(items.map((item) => item.transactionType));

		// Filter categories based on transaction types
		const filtered = categoriaOptions.filter((option) => {
			if (!option.group) return false;
			return Array.from(transactionTypes).some(
				(type) => option.group?.toLowerCase() === type.toLowerCase(),
			);
		});

		return groupAndSortCategorias(filtered);
	}, [categoriaOptions, items]);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			if (!pagadorId) {
				toast.error("Selecione o pagador.");
				return;
			}

			if (!categoriaId) {
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
					if (isCredit && !cartaoId) {
						toast.error("Selecione um cartão de crédito.");
						return;
					}

					if (!isCredit && !contaId) {
						toast.error("Selecione uma conta.");
						return;
					}

					const payload = {
						purchaseDate: item.purchaseDate,
						period: item.period,
						name: item.name,
						transactionType: item.transactionType as
							| "Despesa"
							| "Receita"
							| "Transferência",
						amount: sanitizedAmount,
						condition: item.condition as "À vista" | "Parcelado" | "Recorrente",
						paymentMethod: item.paymentMethod as
							| "Cartão de crédito"
							| "Cartão de débito"
							| "Pix"
							| "Dinheiro"
							| "Boleto"
							| "Pré-Pago | VR/VA"
							| "Transferência bancária",
						pagadorId,
						secondaryPagadorId: undefined,
						isSplit: false,
						contaId: isCredit ? undefined : contaId,
						cartaoId: isCredit ? cartaoId : undefined,
						categoriaId,
						note: item.note || undefined,
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

					const result = await createLancamentoAction(payload);

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
		},
		[items, pagadorId, categoriaId, contaId, cartaoId, handleOpenChange],
	);

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
						pagador, categoria e forma de pagamento para aplicar a todos.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="pagador">Pagador *</Label>
						<Select value={pagadorId} onValueChange={setPagadorId}>
							<SelectTrigger id="pagador" className="w-full">
								<SelectValue placeholder="Selecione o pagador">
									{pagadorId &&
										(() => {
											const selectedOption = pagadorOptions.find(
												(opt) => opt.value === pagadorId,
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
					</div>

					<div className="space-y-2">
						<Label htmlFor="categoria">Categoria *</Label>
						<Select value={categoriaId} onValueChange={setCategoriaId}>
							<SelectTrigger id="categoria" className="w-full">
								<SelectValue placeholder="Selecione a categoria">
									{categoriaId &&
										(() => {
											const selectedOption = categoriaOptions.find(
												(opt) => opt.value === categoriaId,
											);
											return selectedOption ? (
												<CategoriaSelectContent
													label={selectedOption.label}
													icon={selectedOption.icon}
												/>
											) : null;
										})()}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{categoriaGroups.map((group) => (
									<SelectGroup key={group.label}>
										<SelectLabel>{group.label}</SelectLabel>
										{group.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<CategoriaSelectContent
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
							<Select value={contaId} onValueChange={setContaId}>
								<SelectTrigger id="conta" className="w-full">
									<SelectValue placeholder="Selecione a conta">
										{contaId &&
											(() => {
												const selectedOption = contaOptions.find(
													(opt) => opt.value === contaId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={false}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{contaOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<ContaCartaoSelectContent
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
							<Select value={cartaoId} onValueChange={setCartaoId}>
								<SelectTrigger id="cartao" className="w-full">
									<SelectValue placeholder="Selecione o cartão">
										{cartaoId &&
											(() => {
												const selectedOption = cartaoOptions.find(
													(opt) => opt.value === cartaoId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={true}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{cartaoOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<ContaCartaoSelectContent
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
