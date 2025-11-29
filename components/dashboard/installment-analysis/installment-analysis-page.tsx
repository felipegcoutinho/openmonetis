"use client";

import MoneyValues from "@/components/money-values";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RiCalculatorLine,
  RiCheckboxBlankLine,
  RiCheckboxLine,
} from "@remixicon/react";
import { useMemo, useState } from "react";
import { InstallmentGroupCard } from "./installment-group-card";
import type { InstallmentAnalysisData } from "./types";

type InstallmentAnalysisPageProps = {
  data: InstallmentAnalysisData;
};

export function InstallmentAnalysisPage({
  data,
}: InstallmentAnalysisPageProps) {
  // Estado para parcelas selecionadas: Map<seriesId, Set<installmentId>>
  const [selectedInstallments, setSelectedInstallments] = useState<
    Map<string, Set<string>>
  >(new Map());

  // Calcular se está tudo selecionado (apenas parcelas não pagas)
  const isAllSelected = useMemo(() => {
    const allInstallmentsSelected = data.installmentGroups.every((group) => {
      const groupSelection = selectedInstallments.get(group.seriesId);
      const unpaidInstallments = group.pendingInstallments.filter(
        (i) => !i.isSettled
      );
      if (!groupSelection || unpaidInstallments.length === 0) return false;
      return groupSelection.size === unpaidInstallments.length;
    });

    return allInstallmentsSelected && data.installmentGroups.length > 0;
  }, [selectedInstallments, data]);

  // Função para selecionar/desselecionar tudo
  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Desmarcar tudo
      setSelectedInstallments(new Map());
    } else {
      // Marcar tudo (exceto parcelas já pagas)
      const newInstallments = new Map<string, Set<string>>();
      data.installmentGroups.forEach((group) => {
        const unpaidIds = group.pendingInstallments
          .filter((i) => !i.isSettled)
          .map((i) => i.id);
        if (unpaidIds.length > 0) {
          newInstallments.set(group.seriesId, new Set(unpaidIds));
        }
      });

      setSelectedInstallments(newInstallments);
    }
  };

  // Função para selecionar/desselecionar um grupo de parcelas
  const toggleGroupSelection = (seriesId: string, installmentIds: string[]) => {
    const newMap = new Map(selectedInstallments);
    const current = newMap.get(seriesId) || new Set<string>();

    if (current.size === installmentIds.length) {
      // Já está tudo selecionado, desmarcar
      newMap.delete(seriesId);
    } else {
      // Marcar tudo
      newMap.set(seriesId, new Set(installmentIds));
    }

    setSelectedInstallments(newMap);
  };

  // Função para selecionar/desselecionar parcela individual
  const toggleInstallmentSelection = (
    seriesId: string,
    installmentId: string
  ) => {
    const newMap = new Map(selectedInstallments);
    // Criar uma NOVA instância do Set para React detectar a mudança
    const current = new Set(newMap.get(seriesId) || []);

    if (current.has(installmentId)) {
      current.delete(installmentId);
      if (current.size === 0) {
        newMap.delete(seriesId);
      } else {
        newMap.set(seriesId, current);
      }
    } else {
      current.add(installmentId);
      newMap.set(seriesId, current);
    }

    setSelectedInstallments(newMap);
  };

  // Calcular totais
  const { grandTotal, selectedCount } = useMemo(() => {
    let installmentsSum = 0;
    let installmentsCount = 0;

    selectedInstallments.forEach((installmentIds, seriesId) => {
      const group = data.installmentGroups.find((g) => g.seriesId === seriesId);
      if (group) {
        installmentIds.forEach((id) => {
          const installment = group.pendingInstallments.find(
            (i) => i.id === id
          );
          if (installment && !installment.isSettled) {
            installmentsSum += installment.amount;
            installmentsCount++;
          }
        });
      }
    });

    return {
      grandTotal: installmentsSum,
      selectedCount: installmentsCount,
    };
  }, [selectedInstallments, data]);

  const hasNoData = data.installmentGroups.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Card de resumo principal */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-center gap-2 py-2">
          <p className="text-sm font-medium text-muted-foreground">
            Se você pagar tudo que está selecionado:
          </p>
          <MoneyValues
            amount={grandTotal}
            className="text-3xl font-bold text-primary"
          />
          <p className="text-sm text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? "parcela" : "parcelas"}{" "}
            selecionadas
          </p>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      {!hasNoData && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            className="gap-2"
          >
            {isAllSelected ? (
              <RiCheckboxLine className="size-4" />
            ) : (
              <RiCheckboxBlankLine className="size-4" />
            )}
            {isAllSelected ? "Desmarcar Tudo" : "Selecionar Tudo"}
          </Button>
        </div>
      )}

      {/* Seção de Lançamentos Parcelados */}
      {data.installmentGroups.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.installmentGroups.map((group) => (
            <InstallmentGroupCard
              key={group.seriesId}
              group={group}
              selectedInstallments={
                selectedInstallments.get(group.seriesId) || new Set()
              }
              onToggleGroup={() =>
                toggleGroupSelection(
                  group.seriesId,
                  group.pendingInstallments
                    .filter((i) => !i.isSettled)
                    .map((i) => i.id)
                )
              }
              onToggleInstallment={(installmentId) =>
                toggleInstallmentSelection(group.seriesId, installmentId)
              }
            />
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {hasNoData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <RiCalculatorLine className="size-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">Nenhuma parcela pendente</p>
              <p className="text-sm text-muted-foreground">
                Você está em dia com seus pagamentos!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
