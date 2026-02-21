"use client";

import {
	RiAddCircleLine,
	RiArrowRightSLine,
	RiFileCopyLine,
	RiFundsLine,
} from "@remixicon/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	deleteBudgetAction,
	duplicatePreviousMonthBudgetsAction,
} from "@/app/(dashboard)/orcamentos/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";
import { BudgetCard } from "./budget-card";
import { BudgetDialog } from "./budget-dialog";
import type { Budget, BudgetCategory } from "./types";

interface BudgetsPageProps {
	budgets: Budget[];
	categories: BudgetCategory[];
	selectedPeriod: string;
	periodLabel: string;
}

export function BudgetsPage({
	budgets,
	categories,
	selectedPeriod,
	periodLabel,
}: BudgetsPageProps) {
	const [editOpen, setEditOpen] = useState(false);
	const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [budgetToRemove, setBudgetToRemove] = useState<Budget | null>(null);
	const [duplicateOpen, setDuplicateOpen] = useState(false);

	const hasBudgets = budgets.length > 0;

	const handleEdit = useCallback((budget: Budget) => {
		setSelectedBudget(budget);
		setEditOpen(true);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedBudget(null);
		}
	}, []);

	const handleRemoveRequest = useCallback((budget: Budget) => {
		setBudgetToRemove(budget);
		setRemoveOpen(true);
	}, []);

	const handleRemoveOpenChange = useCallback((open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setBudgetToRemove(null);
		}
	}, []);

	const handleRemoveConfirm = useCallback(async () => {
		if (!budgetToRemove) {
			return;
		}

		const result = await deleteBudgetAction({ id: budgetToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [budgetToRemove]);

	const handleDuplicateConfirm = useCallback(async () => {
		const result = await duplicatePreviousMonthBudgetsAction({
			period: selectedPeriod,
		});

		if (result.success) {
			toast.success(result.message);
			setDuplicateOpen(false);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [selectedPeriod]);

	const removeTitle = budgetToRemove
		? `Remover orçamento de "${
				budgetToRemove.category?.name ?? "categoria removida"
			}"?`
		: "Remover orçamento?";

	const emptyDescription =
		categories.length === 0
			? "Cadastre uma categoria de despesa para começar a planejar seus gastos."
			: "Crie seu primeiro orçamento para controlar os gastos por categoria.";

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				{/* No mobile: rolagem horizontal + seta + botões menores */}
				<div className="relative -mx-6 px-6 md:mx-0 md:px-0">
					<div className="overflow-x-auto overflow-y-hidden scroll-smooth md:overflow-visible [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						<div className="flex w-max shrink-0 justify-start gap-3 py-1 md:w-full md:gap-4 md:py-0">
							<BudgetDialog
								mode="create"
								categories={categories}
								defaultPeriod={selectedPeriod}
								trigger={
									<Button
										disabled={categories.length === 0}
										className="h-8 shrink-0 px-3 text-xs md:h-9 md:px-4 md:text-sm"
									>
										<RiAddCircleLine className="size-4" />
										Novo orçamento
									</Button>
								}
							/>
							<Button
								variant="outline"
								disabled={categories.length === 0}
								onClick={() => setDuplicateOpen(true)}
								className="h-8 shrink-0 px-3 text-xs md:h-9 md:px-4 md:text-sm"
							>
								<RiFileCopyLine className="size-4" />
								Copiar orçamentos do último mês
							</Button>
						</div>
					</div>
					<div
						className="pointer-events-none absolute right-0 top-0 hidden h-9 w-10 items-center justify-end bg-gradient-to-l from-background to-transparent py-1 md:hidden"
						aria-hidden
					>
						<RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
					</div>
				</div>

				{hasBudgets ? (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{budgets.map((budget, index) => (
							<BudgetCard
								key={budget.id}
								budget={budget}
								colorIndex={index}
								periodLabel={periodLabel}
								onEdit={handleEdit}
								onRemove={handleRemoveRequest}
							/>
						))}
					</div>
				) : (
					<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
						<EmptyState
							media={<RiFundsLine className="size-6 text-primary" />}
							title="Nenhum orçamento cadastrado"
							description={emptyDescription}
						/>
					</Card>
				)}
			</div>

			<BudgetDialog
				mode="update"
				budget={selectedBudget ?? undefined}
				categories={categories}
				defaultPeriod={selectedPeriod}
				open={editOpen && !!selectedBudget}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!budgetToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Esta ação remove o limite configurado para a categoria selecionada."
				confirmLabel="Remover orçamento"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>

			<ConfirmActionDialog
				open={duplicateOpen}
				onOpenChange={setDuplicateOpen}
				title="Copiar orçamentos do último mês?"
				description="Isso copiará os limites definidos no mês anterior para as categorias que ainda não possuem orçamento neste mês."
				confirmLabel="Copiar orçamentos"
				pendingLabel="Copiando..."
				onConfirm={handleDuplicateConfirm}
			/>
		</>
	);
}
