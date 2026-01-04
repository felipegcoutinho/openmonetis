"use client";

import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodPicker } from "@/components/period-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CalculatorDialogButton } from "@/components/calculadora/calculator-dialog";
import { RiCalculatorLine } from "@remixicon/react";
import { EstabelecimentoInput } from "../../shared/estabelecimento-input";
import type { BasicFieldsSectionProps } from "./lancamento-dialog-types";

export function BasicFieldsSection({
  formState,
  onFieldChange,
  estabelecimentos,
}: Omit<BasicFieldsSectionProps, "monthOptions">) {
  return (
    <>
      <div className="flex w-full flex-col gap-2 md:flex-row">
        <div className="w-1/2 space-y-1">
          <Label htmlFor="purchaseDate">Data da transação</Label>
          <DatePicker
            id="purchaseDate"
            value={formState.purchaseDate}
            onChange={(value) => onFieldChange("purchaseDate", value)}
            placeholder="Data da transação"
            required
          />
        </div>

        <div className="w-1/2 space-y-1">
          <Label htmlFor="period">Período</Label>
          <PeriodPicker
            value={formState.period}
            onChange={(value) => onFieldChange("period", value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 md:flex-row">
        <div className="w-1/2 space-y-1">
          <Label htmlFor="name">Estabelecimento</Label>
          <EstabelecimentoInput
            id="name"
            value={formState.name}
            onChange={(value) => onFieldChange("name", value)}
            estabelecimentos={estabelecimentos}
            placeholder="Ex.: Padaria"
            maxLength={20}
            required
          />
        </div>

        <div className="w-1/2 space-y-1">
          <Label htmlFor="amount">Valor</Label>
          <div className="relative">
            <CurrencyInput
              id="amount"
              value={formState.amount}
              onValueChange={(value) => onFieldChange("amount", value)}
              placeholder="R$ 0,00"
              required
              className="pr-10"
            />
            <CalculatorDialogButton
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            >
              <RiCalculatorLine className="h-4 w-4 text-muted-foreground" />
            </CalculatorDialogButton>
          </div>
        </div>
      </div>
    </>
  );
}
