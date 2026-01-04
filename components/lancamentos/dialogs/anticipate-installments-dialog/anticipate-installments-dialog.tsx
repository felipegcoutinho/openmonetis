"use client";

import {
  createInstallmentAnticipationAction,
  getEligibleInstallmentsAction,
} from "@/app/(dashboard)/lancamentos/anticipation-actions";
import { CategoryIcon } from "@/components/categorias/category-icon";
import { InstallmentSelectionTable } from "./installment-selection-table";
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
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PeriodPicker } from "@/components/period-picker";
import { useControlledState } from "@/hooks/use-controlled-state";
import { useFormState } from "@/hooks/use-form-state";
import type { EligibleInstallment } from "@/lib/installments/anticipation-types";
import { RiLoader4Line } from "@remixicon/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import MoneyValues from "@/components/money-values";

interface AnticipateInstallmentsDialogProps {
  trigger?: React.ReactNode;
  seriesId: string;
  lancamentoName: string;
  categorias: Array<{ id: string; name: string; icon: string | null }>;
  pagadores: Array<{ id: string; name: string }>;
  defaultPeriod: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type AnticipationFormValues = {
  anticipationPeriod: string;
  discount: number;
  pagadorId: string;
  categoriaId: string;
  note: string;
};

export function AnticipateInstallmentsDialog({
  trigger,
  seriesId,
  lancamentoName,
  categorias,
  pagadores,
  defaultPeriod,
  open,
  onOpenChange,
}: AnticipateInstallmentsDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [eligibleInstallments, setEligibleInstallments] = useState<
    EligibleInstallment[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Use controlled state hook for dialog open state
  const [dialogOpen, setDialogOpen] = useControlledState(
    open,
    false,
    onOpenChange
  );

  // Use form state hook for form management
  const { formState, updateField, setFormState } =
    useFormState<AnticipationFormValues>({
      anticipationPeriod: defaultPeriod,
      discount: 0,
      pagadorId: "",
      categoriaId: "",
      note: "",
    });

  // Buscar parcelas elegíveis ao abrir o dialog
  useEffect(() => {
    if (dialogOpen) {
      setIsLoadingInstallments(true);
      setSelectedIds([]);
      setErrorMessage(null);

      getEligibleInstallmentsAction(seriesId)
        .then((result) => {
          if (result.success && result.data) {
            setEligibleInstallments(result.data);

            // Pré-preencher pagador e categoria da primeira parcela
            if (result.data.length > 0) {
              const first = result.data[0];
              setFormState({
                anticipationPeriod: defaultPeriod,
                discount: 0,
                pagadorId: first.pagadorId ?? "",
                categoriaId: first.categoriaId ?? "",
                note: "",
              });
            }
          } else {
            toast.error(result.error || "Erro ao carregar parcelas");
            setEligibleInstallments([]);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar parcelas:", error);
          toast.error("Erro ao carregar parcelas elegíveis");
          setEligibleInstallments([]);
        })
        .finally(() => {
          setIsLoadingInstallments(false);
        });
    }
  }, [dialogOpen, seriesId, defaultPeriod, setFormState]);

  const totalAmount = useMemo(() => {
    return eligibleInstallments
      .filter((inst) => selectedIds.includes(inst.id))
      .reduce((sum, inst) => sum + Number(inst.amount), 0);
  }, [eligibleInstallments, selectedIds]);

  const finalAmount = useMemo(() => {
    // Se for despesa (negativo), soma o desconto para reduzir
    // Se for receita (positivo), subtrai o desconto
    const discount = Number(formState.discount) || 0;
    return totalAmount < 0 ? totalAmount + discount : totalAmount - discount;
  }, [totalAmount, formState.discount]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);

      if (selectedIds.length === 0) {
        const message = "Selecione pelo menos uma parcela para antecipar.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (formState.anticipationPeriod.length === 0) {
        const message = "Informe o período da antecipação.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const discount = Number(formState.discount) || 0;
      if (discount > Math.abs(totalAmount)) {
        const message =
          "O desconto não pode ser maior que o valor total das parcelas.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      startTransition(async () => {
        const result = await createInstallmentAnticipationAction({
          seriesId,
          installmentIds: selectedIds,
          anticipationPeriod: formState.anticipationPeriod,
          discount: Number(formState.discount) || 0,
          pagadorId: formState.pagadorId || undefined,
          categoriaId: formState.categoriaId || undefined,
          note: formState.note || undefined,
        });

        if (result.success) {
          toast.success(result.message);
          setDialogOpen(false);
        } else {
          const errorMsg = result.error || "Erro ao criar antecipação";
          setErrorMessage(errorMsg);
          toast.error(errorMsg);
        }
      });
    },
    [selectedIds, formState, seriesId, setDialogOpen]
  );

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
  }, [setDialogOpen]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
        <DialogHeader>
          <DialogTitle>Antecipar Parcelas</DialogTitle>
          <DialogDescription>{lancamentoName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção 1: Seleção de Parcelas */}
          <FieldGroup className="gap-1">
            <FieldLegend>Parcelas Disponíveis</FieldLegend>

            {isLoadingInstallments ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                <RiLoader4Line className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Carregando parcelas...
                </span>
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto rounded-lg border">
                <InstallmentSelectionTable
                  installments={eligibleInstallments}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
              </div>
            )}
          </FieldGroup>

          {/* Seção 2: Configuração da Antecipação */}
          <FieldGroup className="gap-1">
            <FieldLegend>Configuração</FieldLegend>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field className="gap-1">
                <FieldLabel htmlFor="anticipation-period">Período</FieldLabel>
                <FieldContent>
                  <PeriodPicker
                    value={formState.anticipationPeriod}
                    onChange={(value) =>
                      updateField("anticipationPeriod", value)
                    }
                    disabled={isPending}
                    className="w-full"
                  />
                </FieldContent>
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="anticipation-discount">
                  Desconto
                </FieldLabel>
                <FieldContent>
                  <CurrencyInput
                    id="anticipation-discount"
                    value={formState.discount}
                    onValueChange={(value) =>
                      updateField("discount", value ?? 0)
                    }
                    placeholder="R$ 0,00"
                    disabled={isPending}
                  />
                </FieldContent>
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="anticipation-pagador">Pagador</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.pagadorId}
                    onValueChange={(value) => updateField("pagadorId", value)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="anticipation-pagador" className="w-full">
                      <SelectValue placeholder="Padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {pagadores.map((pagador) => (
                        <SelectItem key={pagador.id} value={pagador.id}>
                          {pagador.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field className="gap-1">
                <FieldLabel htmlFor="anticipation-categoria">
                  Categoria
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.categoriaId}
                    onValueChange={(value) => updateField("categoriaId", value)}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="anticipation-categoria"
                      className="w-full"
                    >
                      <SelectValue placeholder="Padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon
                              name={categoria.icon ?? undefined}
                              className="size-4"
                            />
                            <span>{categoria.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="anticipation-note">Observação</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="anticipation-note"
                    value={formState.note}
                    onChange={(e) => updateField("note", e.target.value)}
                    placeholder="Observação (opcional)"
                    rows={2}
                    disabled={isPending}
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>

          {/* Seção 3: Resumo */}
          {selectedIds.length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <h4 className="text-sm font-semibold mb-2">Resumo</h4>
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {selectedIds.length} parcela
                    {selectedIds.length > 1 ? "s" : ""}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    <MoneyValues amount={totalAmount} className="text-sm" />
                  </dd>
                </div>
                {Number(formState.discount) > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Desconto</dt>
                    <dd className="font-medium tabular-nums text-green-600">
                      -{" "}
                      <MoneyValues
                        amount={Number(formState.discount)}
                        className="text-sm"
                      />
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-1.5">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-base font-semibold tabular-nums text-primary">
                    <MoneyValues amount={finalAmount} className="text-sm" />
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Mensagem de erro */}
          {errorMessage && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedIds.length === 0}
            >
              {isPending ? (
                <>
                  <RiLoader4Line className="mr-2 size-4 animate-spin" />
                  Antecipando...
                </>
              ) : (
                "Confirmar Antecipação"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
