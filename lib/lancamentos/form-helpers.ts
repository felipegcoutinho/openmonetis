/**
 * Form state management helpers for lancamentos
 */

import type { LancamentoItem } from "@/components/lancamentos/types";
import { LANCAMENTO_CONDITIONS, LANCAMENTO_PAYMENT_METHODS, LANCAMENTO_TRANSACTION_TYPES } from "./constants";
import { derivePeriodFromDate } from "@/lib/utils/period";
import { getTodayDateString } from "@/lib/utils/date";

/**
 * Form state type for lancamento dialog
 */
export type LancamentoFormState = {
  purchaseDate: string;
  period: string;
  name: string;
  transactionType: string;
  amount: string;
  condition: string;
  paymentMethod: string;
  pagadorId: string | undefined;
  secondaryPagadorId: string | undefined;
  isSplit: boolean;
  contaId: string | undefined;
  cartaoId: string | undefined;
  categoriaId: string | undefined;
  installmentCount: string;
  recurrenceCount: string;
  dueDate: string;
  boletoPaymentDate: string;
  note: string;
  isSettled: boolean | null;
};

/**
 * Initial state overrides for lancamento form
 */
export type LancamentoFormOverrides = {
  defaultCartaoId?: string | null;
  defaultPaymentMethod?: string | null;
  defaultPurchaseDate?: string | null;
  isImporting?: boolean;
};

/**
 * Builds initial form state from lancamento data and defaults
 */
export function buildLancamentoInitialState(
  lancamento?: LancamentoItem,
  defaultPagadorId?: string | null,
  preferredPeriod?: string,
  overrides?: LancamentoFormOverrides
): LancamentoFormState {
  const purchaseDate = lancamento?.purchaseDate
    ? lancamento.purchaseDate.slice(0, 10)
    : overrides?.defaultPurchaseDate ?? "";

  const paymentMethod =
    lancamento?.paymentMethod ??
    overrides?.defaultPaymentMethod ??
    LANCAMENTO_PAYMENT_METHODS[0];

  const derivedPeriod = derivePeriodFromDate(purchaseDate);
  const fallbackPeriod =
    preferredPeriod && /^\d{4}-\d{2}$/.test(preferredPeriod)
      ? preferredPeriod
      : derivedPeriod;

  // Quando importando, usar valores padrão do usuário logado ao invés dos valores do lançamento original
  const isImporting = overrides?.isImporting ?? false;
  const fallbackPagadorId = isImporting
    ? (defaultPagadorId ?? null)
    : (lancamento?.pagadorId ?? defaultPagadorId ?? null);

  const boletoPaymentDate =
    lancamento?.boletoPaymentDate ??
    (paymentMethod === "Boleto" && (lancamento?.isSettled ?? false)
      ? getTodayDateString()
      : "");

  // Calcular o valor correto para importação de parcelados
  let amountValue = "";
  if (typeof lancamento?.amount === "number") {
    let baseAmount = Math.abs(lancamento.amount);

    // Se está importando e é parcelado, usar o valor total (parcela * quantidade)
    if (isImporting && lancamento.condition === "Parcelado" && lancamento.installmentCount) {
      baseAmount = baseAmount * lancamento.installmentCount;
    }

    amountValue = (Math.round(baseAmount * 100) / 100).toFixed(2);
  }

  return {
    purchaseDate,
    period:
      lancamento?.period && /^\d{4}-\d{2}$/.test(lancamento.period)
        ? lancamento.period
        : fallbackPeriod,
    name: lancamento?.name ?? "",
    transactionType:
      lancamento?.transactionType ?? LANCAMENTO_TRANSACTION_TYPES[0],
    amount: amountValue,
    condition: lancamento?.condition ?? LANCAMENTO_CONDITIONS[0],
    paymentMethod,
    pagadorId: fallbackPagadorId ?? undefined,
    secondaryPagadorId: undefined,
    isSplit: false,
    contaId:
      paymentMethod === "Cartão de crédito"
        ? undefined
        : isImporting ? undefined : (lancamento?.contaId ?? undefined),
    cartaoId:
      paymentMethod === "Cartão de crédito"
        ? isImporting ? (overrides?.defaultCartaoId ?? undefined) : (lancamento?.cartaoId ?? overrides?.defaultCartaoId ?? undefined)
        : undefined,
    categoriaId: isImporting ? undefined : (lancamento?.categoriaId ?? undefined),
    installmentCount: lancamento?.installmentCount
      ? String(lancamento.installmentCount)
      : "",
    recurrenceCount: lancamento?.recurrenceCount
      ? String(lancamento.recurrenceCount)
      : "",
    dueDate: lancamento?.dueDate ?? "",
    boletoPaymentDate,
    note: lancamento?.note ?? "",
    isSettled:
      paymentMethod === "Cartão de crédito"
        ? null
        : lancamento?.isSettled ?? true,
  };
}

/**
 * Applies field dependencies when form state changes
 * This function encapsulates the business logic for field interdependencies
 */
export function applyFieldDependencies(
  key: keyof LancamentoFormState,
  value: LancamentoFormState[keyof LancamentoFormState],
  currentState: LancamentoFormState,
  _periodDirty: boolean
): Partial<LancamentoFormState> {
  const updates: Partial<LancamentoFormState> = {};

  // Removed automatic period update when purchase date changes
  // if (key === "purchaseDate" && typeof value === "string") {
  //   if (!periodDirty) {
  //     updates.period = derivePeriodFromDate(value);
  //   }
  // }

  // When condition changes, clear irrelevant fields
  if (key === "condition" && typeof value === "string") {
    if (value !== "Parcelado") {
      updates.installmentCount = "";
    }
    if (value !== "Recorrente") {
      updates.recurrenceCount = "";
    }
  }

  // When payment method changes, adjust related fields
  if (key === "paymentMethod" && typeof value === "string") {
    if (value === "Cartão de crédito") {
      updates.contaId = undefined;
      updates.isSettled = null;
    } else {
      updates.cartaoId = undefined;
      updates.isSettled = currentState.isSettled ?? true;
    }

    // Clear boleto-specific fields if not boleto
    if (value !== "Boleto") {
      updates.dueDate = "";
      updates.boletoPaymentDate = "";
    } else if (currentState.isSettled || (updates.isSettled !== null && updates.isSettled !== undefined)) {
      // Set today's date for boleto payment if settled
      const settled = updates.isSettled ?? currentState.isSettled;
      if (settled) {
        updates.boletoPaymentDate = currentState.boletoPaymentDate || getTodayDateString();
      }
    }
  }

  // When split is disabled, clear secondary pagador
  if (key === "isSplit" && value === false) {
    updates.secondaryPagadorId = undefined;
  }

  // When primary pagador changes, clear secondary if it matches
  if (key === "pagadorId" && typeof value === "string") {
    const secondaryValue = currentState.secondaryPagadorId;
    if (secondaryValue && secondaryValue === value) {
      updates.secondaryPagadorId = undefined;
    }
  }

  // When isSettled changes and payment method is Boleto
  if (key === "isSettled" && currentState.paymentMethod === "Boleto") {
    if (value === true) {
      updates.boletoPaymentDate = currentState.boletoPaymentDate || getTodayDateString();
    } else if (value === false) {
      updates.boletoPaymentDate = "";
    }
  }

  return updates;
}
