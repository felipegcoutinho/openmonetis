import type { LancamentoItem } from "@/components/lancamentos/types";
import { getTodayDateString } from "@/lib/utils/date";
import { derivePeriodFromDate } from "@/lib/utils/period";
import {
	LANCAMENTO_CONDITIONS,
	LANCAMENTO_PAYMENT_METHODS,
	LANCAMENTO_TRANSACTION_TYPES,
} from "./constants";

/**
 * Split type for dividing transactions between payers
 */
export type SplitType = "equal" | "60-40" | "70-30" | "80-20" | "custom";

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
	splitType: SplitType;
	primarySplitAmount: string;
	secondarySplitAmount: string;
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
	defaultName?: string | null;
	defaultAmount?: string | null;
	defaultTransactionType?: "Despesa" | "Receita";
	isImporting?: boolean;
};

/**
 * Builds initial form state from lancamento data and defaults
 */
export function buildLancamentoInitialState(
	lancamento?: LancamentoItem,
	defaultPagadorId?: string | null,
	preferredPeriod?: string,
	overrides?: LancamentoFormOverrides,
): LancamentoFormState {
	const purchaseDate = lancamento?.purchaseDate
		? lancamento.purchaseDate.slice(0, 10)
		: (overrides?.defaultPurchaseDate ?? "");

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
	let amountValue = overrides?.defaultAmount ?? "";
	if (!amountValue && typeof lancamento?.amount === "number") {
		let baseAmount = Math.abs(lancamento.amount);

		// Se está importando e é parcelado, usar o valor total (parcela * quantidade)
		if (
			isImporting &&
			lancamento.condition === "Parcelado" &&
			lancamento.installmentCount
		) {
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
		name: lancamento?.name ?? overrides?.defaultName ?? "",
		transactionType:
			lancamento?.transactionType ??
			overrides?.defaultTransactionType ??
			LANCAMENTO_TRANSACTION_TYPES[0],
		amount: amountValue,
		condition: lancamento?.condition ?? LANCAMENTO_CONDITIONS[0],
		paymentMethod,
		pagadorId: fallbackPagadorId ?? undefined,
		secondaryPagadorId: undefined,
		isSplit: false,
		splitType: "equal",
		primarySplitAmount: "",
		secondarySplitAmount: "",
		contaId:
			paymentMethod === "Cartão de crédito"
				? undefined
				: isImporting
					? undefined
					: (lancamento?.contaId ?? undefined),
		cartaoId:
			paymentMethod === "Cartão de crédito"
				? isImporting
					? (overrides?.defaultCartaoId ?? undefined)
					: (lancamento?.cartaoId ?? overrides?.defaultCartaoId ?? undefined)
				: undefined,
		categoriaId: isImporting
			? undefined
			: (lancamento?.categoriaId ?? undefined),
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
				: (lancamento?.isSettled ?? true),
	};
}

/**
 * Split presets with their percentages
 */
const SPLIT_PRESETS: Record<SplitType, { primary: number; secondary: number }> =
	{
		equal: { primary: 50, secondary: 50 },
		"60-40": { primary: 60, secondary: 40 },
		"70-30": { primary: 70, secondary: 30 },
		"80-20": { primary: 80, secondary: 20 },
		custom: { primary: 50, secondary: 50 },
	};

/**
 * Calculates split amounts based on total and split type
 */
export function calculateSplitAmounts(
	totalAmount: number,
	splitType: SplitType,
): { primary: string; secondary: string } {
	if (totalAmount <= 0) {
		return { primary: "", secondary: "" };
	}

	const preset = SPLIT_PRESETS[splitType];
	const primaryAmount = (totalAmount * preset.primary) / 100;
	const secondaryAmount = totalAmount - primaryAmount;

	return {
		primary: primaryAmount.toFixed(2),
		secondary: secondaryAmount.toFixed(2),
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
	_periodDirty: boolean,
): Partial<LancamentoFormState> {
	const updates: Partial<LancamentoFormState> = {};

	// Ao alterar a data da transação, o período é definido automaticamente
	if (key === "purchaseDate" && typeof value === "string") {
		if (!_periodDirty) {
			updates.period = derivePeriodFromDate(value);
		}
	}

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
		} else if (
			currentState.isSettled ||
			(updates.isSettled !== null && updates.isSettled !== undefined)
		) {
			// Set today's date for boleto payment if settled
			const settled = updates.isSettled ?? currentState.isSettled;
			if (settled) {
				updates.boletoPaymentDate =
					currentState.boletoPaymentDate || getTodayDateString();
			}
		}
	}

	// When split is disabled, clear secondary pagador and split fields
	if (key === "isSplit" && value === false) {
		updates.secondaryPagadorId = undefined;
		updates.splitType = "equal";
		updates.primarySplitAmount = "";
		updates.secondarySplitAmount = "";
	}

	// When split is enabled and amount exists, calculate initial split amounts
	if (key === "isSplit" && value === true) {
		const totalAmount = Number.parseFloat(currentState.amount) || 0;
		if (totalAmount > 0) {
			const half = (totalAmount / 2).toFixed(2);
			updates.primarySplitAmount = half;
			updates.secondarySplitAmount = half;
		}
	}

	// When amount changes and split is enabled, recalculate split amounts
	if (key === "amount" && typeof value === "string" && currentState.isSplit) {
		const totalAmount = Number.parseFloat(value) || 0;
		if (totalAmount > 0) {
			const splitAmounts = calculateSplitAmounts(
				totalAmount,
				currentState.splitType,
			);
			updates.primarySplitAmount = splitAmounts.primary;
			updates.secondarySplitAmount = splitAmounts.secondary;
		} else {
			updates.primarySplitAmount = "";
			updates.secondarySplitAmount = "";
		}
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
			updates.boletoPaymentDate =
				currentState.boletoPaymentDate || getTodayDateString();
		} else if (value === false) {
			updates.boletoPaymentDate = "";
		}
	}

	return updates;
}
