"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createBudgetAction,
	updateBudgetAction,
} from "@/features/budgets/actions";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { PeriodPicker } from "@/shared/components/period-picker";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Slider } from "@/shared/components/ui/slider";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { useFormState } from "@/shared/hooks/use-form-state";
import { formatCurrency } from "@/shared/utils/currency";

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
	categoryId: budget?.category?.id ?? "",
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

	const initialState = useMemo(
		() =>
			buildInitialValues({
				budget,
				defaultPeriod,
			}),
		[budget, defaultPeriod],
	);

	// Use form state hook for form management
	const { formState, resetForm, updateField } =
		useFormState<BudgetFormValues>(initialState);

	// Reset form when dialog opens
	useEffect(() => {
		if (dialogOpen) {
			resetForm(initialState);
			setErrorMessage(null);
		}
	}, [dialogOpen, initialState, resetForm]);

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

		if (formState.categoryId.length === 0) {
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
			categoryId: formState.categoryId,
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
				resetForm(initialState);
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
	const parsedAmount = Number.parseFloat(formState.amount);
	const sliderValue = Number.isFinite(parsedAmount)
		? Math.max(0, parsedAmount)
		: 0;
	const baseForSlider = Math.max(budget?.spent ?? 0, sliderValue, 1000);
	const sliderMax = Math.max(
		1000,
		Math.ceil((baseForSlider * 1.5) / 100) * 100,
	);

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
								value={formState.categoryId}
								onValueChange={(value) => updateField("categoryId", value)}
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

						<div className="space-y-4">
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
								<div className="space-y-3 rounded-md border p-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Limite atual</span>
										<span className="font-semibold text-foreground">
											{formatCurrency(sliderValue)}
										</span>
									</div>

									<Slider
										id="budget-amount"
										value={[sliderValue]}
										min={0}
										max={sliderMax}
										step={10}
										onValueChange={(value) =>
											updateField("amount", value[0]?.toFixed(2) ?? "0.00")
										}
									/>

									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>{formatCurrency(0)}</span>
										<span>{formatCurrency(sliderMax)}</span>
									</div>
								</div>
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
