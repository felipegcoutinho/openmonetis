import type { InstallmentExpense } from "@/features/dashboard/expenses/installment-expenses-queries";
import {
	calculateLastInstallmentDate,
	formatLastInstallmentDate,
} from "@/shared/lib/installments/utils";

export type InstallmentExpenseDisplay = {
	compactLabel: string | null;
	isLast: boolean;
	remainingInstallments: number;
	remainingAmount: number;
	endDate: string | null;
	progress: number;
};

export const buildInstallmentCompactLabel = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (currentInstallment && installmentCount) {
		return `${currentInstallment} de ${installmentCount}`;
	}

	return null;
};

export const isInstallmentLast = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (!currentInstallment || !installmentCount) {
		return false;
	}

	return currentInstallment === installmentCount && installmentCount > 1;
};

export const calculateInstallmentRemainingCount = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (!currentInstallment || !installmentCount) {
		return 0;
	}

	return Math.max(0, installmentCount - currentInstallment);
};

export const calculateInstallmentRemainingAmount = (
	amount: number,
	currentInstallment: number | null,
	installmentCount: number | null,
) =>
	amount *
	calculateInstallmentRemainingCount(currentInstallment, installmentCount);

export const formatInstallmentEndDate = (
	period: string,
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (!currentInstallment || !installmentCount) {
		return null;
	}

	const lastDate = calculateLastInstallmentDate(
		period,
		currentInstallment,
		installmentCount,
	);

	return formatLastInstallmentDate(lastDate);
};

export const buildInstallmentProgress = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (!currentInstallment || !installmentCount || installmentCount <= 0) {
		return 0;
	}

	return Math.min(
		100,
		Math.max(0, (currentInstallment / installmentCount) * 100),
	);
};

export const buildInstallmentExpenseDisplay = (
	expense: InstallmentExpense,
): InstallmentExpenseDisplay => {
	const { amount, currentInstallment, installmentCount, period } = expense;

	return {
		compactLabel: buildInstallmentCompactLabel(
			currentInstallment,
			installmentCount,
		),
		isLast: isInstallmentLast(currentInstallment, installmentCount),
		remainingInstallments: calculateInstallmentRemainingCount(
			currentInstallment,
			installmentCount,
		),
		remainingAmount: calculateInstallmentRemainingAmount(
			amount,
			currentInstallment,
			installmentCount,
		),
		endDate: formatInstallmentEndDate(
			period,
			currentInstallment,
			installmentCount,
		),
		progress: buildInstallmentProgress(currentInstallment, installmentCount),
	};
};
