"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createBudgetAction,
	updateBudgetAction,
} from "@/app/(dashboard)/orcamentos/actions";
import { CategoryIcon } from "@/components/categorias/category-icon";
import { PeriodPicker } from "@/components/period-picker";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useControlledState } from "@/hooks/use-controlled-state";
import { useFormState } from "@/hooks/use-form-state";

import type { Budget, BudgetCategory, BudgetFormValues } from "./types";

interface BudgetDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	budget?: Budget;
	categories: BudgetCategory[];
	defaultPeriod: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
	budget,
	defaultPeriod,
}: {
	budget?: Budget;
	defaultPeriod: string;
}): BudgetFormValues => ({
	categoriaId: budget?.category?.id ?? "",
	period: budget?.period ?? defaultPeriod,
	amount: budget ? (Math.round(budget.amount * 100) / 100).toFixed(2) : "",
});

export function BudgetDialog({
	mode,
	trigger,
	budget,
	categories,
	defaultPeriod,
	open,
	onOpenChange,
}: BudgetDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = buildInitialValues({
		budget,
		defaultPeriod,
	});

	// Use form state hook for form management
	const { formState, updateField, setFormState } =
		useFormState<BudgetFormValues>(initialState);

	// Reset form when dialog opens
	useEffect(() => {
		if (dialogOpen) {
			setFormState(initialState);
			setErrorMessage(null);
		}
	}, [dialogOpen, setFormState, initialState]);

	// Clear error when dialog closes
	useEffect(() => {
		if (!dialogOpen) {
			setErrorMessage(null);
		}
	}, [dialogOpen]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);

		if (mode === "update" && !budget?.id) {
			const message = "Orçamento inválido.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.categoriaId.length === 0) {
			const message = "Selecione uma categoria.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.period.length === 0) {
			const message = "Informe o período.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.amount.length === 0) {
			const message = "Informe o valor limite.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const payload = {
			categoriaId: formState.categoriaId,
			period: formState.period,
			amount: formState.amount,
		};

		startTransition(async () => {
			const result =
				mode === "create"
					? await createBudgetAction(payload)
					: await updateBudgetAction({
							id: budget?.id ?? "",
							...payload,
						});

			if (result.success) {
				toast.success(result.message);
				setDialogOpen(false);
				setFormState(initialState);
				return;
			}

			setErrorMessage(result.error);
			toast.error(result.error);
		});
	};

	const title = mode === "create" ? "Novo orçamento" : "Editar orçamento";
	const description =
		mode === "create"
			? "Defina um limite de gastos para acompanhar suas despesas."
			: "Atualize os detalhes do orçamento selecionado.";
	const submitLabel =
		mode === "create" ? "Salvar orçamento" : "Atualizar orçamento";
	const disabled = categories.length === 0;

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{disabled ? (
					<div className="space-y-4">
						<div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
							Cadastre pelo menos uma categoria de despesa para criar um
							orçamento.
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
							>
								Fechar
							</Button>
						</DialogFooter>
					</div>
				) : (
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="budget-category">Categoria</Label>
							<Select
								value={formState.categoriaId}
								onValueChange={(value) => updateField("categoriaId", value)}
							>
								<SelectTrigger id="budget-category" className="w-full">
									<SelectValue placeholder="Selecione uma categoria" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											<CategoryIcon
												name={category.icon ?? undefined}
												className="size-4"
											/>
											<span>{category.name}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="budget-period">Período</Label>
								<PeriodPicker
									value={formState.period}
									onChange={(value) => updateField("period", value)}
									className="w-full"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="budget-amount">Valor limite</Label>
								<CurrencyInput
									id="budget-amount"
									placeholder="R$ 0,00"
									value={formState.amount}
									onValueChange={(value) => updateField("amount", value)}
								/>
							</div>
						</div>

						{errorMessage ? (
							<p className="text-sm font-medium text-destructive">
								{errorMessage}
							</p>
						) : null}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? "Salvando..." : submitLabel}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
