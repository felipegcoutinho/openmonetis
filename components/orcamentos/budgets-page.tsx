"use client";

import { deleteBudgetAction } from "@/app/(dashboard)/orcamentos/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { RiAddCircleLine, RiFundsLine } from "@remixicon/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
        <div className="flex justify-start">
          <BudgetDialog
            mode="create"
            categories={categories}
            defaultPeriod={selectedPeriod}
            trigger={
              <Button disabled={categories.length === 0}>
                <RiAddCircleLine className="size-4" />
                Novo orçamento
              </Button>
            }
          />
        </div>

        {hasBudgets ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
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
    </>
  );
}
