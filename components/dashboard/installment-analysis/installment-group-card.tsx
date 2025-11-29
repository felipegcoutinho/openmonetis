"use client";

import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/ui";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
} from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import type { InstallmentGroup } from "./types";

type InstallmentGroupCardProps = {
  group: InstallmentGroup;
  selectedInstallments: Set<string>;
  onToggleGroup: () => void;
  onToggleInstallment: (installmentId: string) => void;
};

export function InstallmentGroupCard({
  group,
  selectedInstallments,
  onToggleGroup,
  onToggleInstallment,
}: InstallmentGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const unpaidInstallments = group.pendingInstallments.filter(
    (i) => !i.isSettled
  );

  const unpaidCount = unpaidInstallments.length;

  const isFullySelected =
    selectedInstallments.size === unpaidInstallments.length &&
    unpaidInstallments.length > 0;

  const progress =
    group.totalInstallments > 0
      ? (group.paidInstallments / group.totalInstallments) * 100
      : 0;

  const selectedAmount = group.pendingInstallments
    .filter((i) => selectedInstallments.has(i.id) && !i.isSettled)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Calcular valor total de todas as parcelas (pagas + pendentes)
  const totalAmount = group.pendingInstallments.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  // Calcular valor pendente (apenas não pagas)
  const pendingAmount = unpaidInstallments.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  return (
    <Card className={cn(isFullySelected && "border-primary/50")}>
      <CardContent className="flex flex-col gap-2">
        {/* Header do card */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isFullySelected}
            onCheckedChange={onToggleGroup}
            className="mt-1"
            aria-label={`Selecionar todas as parcelas de ${group.name}`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex gap-1 items-center">
                  {group.cartaoLogo && (
                    <img
                      src={`/logos/${group.cartaoLogo}`}
                      alt={group.cartaoName}
                      className="h-6 w-auto object-contain rounded"
                    />
                  )}
                  <span className="font-medium">{group.name}</span>|
                  <span className="text-xs text-muted-foreground">
                    {group.cartaoName}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <MoneyValues
                    amount={totalAmount}
                    className="text-base font-bold"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Pendente:
                  </span>
                  <MoneyValues
                    amount={pendingAmount}
                    className="text-sm font-medium text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="mb-2 flex items-center px-1 justify-between text-xs text-muted-foreground">
                <span>
                  {group.paidInstallments} de {group.totalInstallments} pagas
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {unpaidCount} {unpaidCount === 1 ? "pendente" : "pendentes"}
                  </span>
                  {selectedInstallments.size > 0 && (
                    <span className="text-primary font-medium">
                      • Selecionado: <MoneyValues amount={selectedAmount} className="text-xs font-medium text-primary inline" />
                    </span>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Botão de expandir */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {isExpanded ? (
                <>
                  <RiArrowDownSLine className="size-4" />
                  Ocultar parcelas ({group.pendingInstallments.length})
                </>
              ) : (
                <>
                  <RiArrowRightSLine className="size-4" />
                  Ver parcelas ({group.pendingInstallments.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de parcelas expandida */}
        {isExpanded && (
          <div className="px-8 mt-2 flex flex-col gap-2">
            {group.pendingInstallments.map((installment) => {
              const isSelected = selectedInstallments.has(installment.id);
              const isPaid = installment.isSettled;
              const dueDate = installment.dueDate
                ? format(installment.dueDate, "dd/MM/yyyy", { locale: ptBR })
                : format(installment.purchaseDate, "dd/MM/yyyy", {
                    locale: ptBR,
                  });

              return (
                <div
                  key={installment.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-2 transition-colors",
                    isSelected && !isPaid && "border-primary/50 bg-primary/5",
                    isPaid &&
                      "border-green-400 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  )}
                >
                  <Checkbox
                    checked={isPaid ? false : isSelected}
                    disabled={isPaid}
                    onCheckedChange={() =>
                      !isPaid && onToggleInstallment(installment.id)
                    }
                    aria-label={`Selecionar parcela ${installment.currentInstallment} de ${group.totalInstallments}`}
                  />

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          isPaid &&
                            "text-green-700 dark:text-green-400 line-through decoration-green-600/50"
                        )}
                      >
                        Parcela {installment.currentInstallment}/
                        {group.totalInstallments}
                        {isPaid && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-xs border-none border-green-700 text-green-700 dark:text-green-400"
                          >
                            <RiCheckboxCircleFill /> Pago
                          </Badge>
                        )}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isPaid
                            ? "text-green-700 dark:text-green-500"
                            : "text-muted-foreground"
                        )}
                      >
                        Vencimento: {dueDate}
                      </p>
                    </div>

                    <MoneyValues
                      amount={installment.amount}
                      className={cn(
                        "shrink-0 text-sm",
                        isPaid && "text-green-700 dark:text-green-400"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
