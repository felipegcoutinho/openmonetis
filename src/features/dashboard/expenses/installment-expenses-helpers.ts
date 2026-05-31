import type { InstallmentExpense } from "@/features/dashboard/expenses/installment-expenses-queries";
import { calculateLastInstallmentDate } from "@/shared/lib/installments/utils";
import { capitalize } from "@/shared/utils/string";

type InstallmentExpenseDisplay = {
	compactLabel: string | null;
	isLast: boolean;
	remainingLabel: "Próximas" | "Em aberto";
	remainingInstallments: number;
	remainingAmount: number;
	endDate: string | null;
	progress: number;
};

const buildInstallmentCompactLabel = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (currentInstallment && installmentCount) {
		return `Parcela ${currentInstallment} de ${installmentCount}`;
	}

	return null;
};

const isInstallmentLast = (
	currentInstallment: number | null,
	installmentCount: number | null,
) => {
	if (!currentInstallment || !installmentCount) {
		return false;
	}

	return currentInstallment === installmentCount && installmentCount > 1;
};

const calculateInstallmentRemainingCount = (
	currentInstallment: number | null,
	installmentCount: number | null,
	isSettled: boolean | null,
) => {
	if (!currentInstallment || !installmentCount) {
		return 0;
	}

	const includeCurrentInstallment = isSettled !== true;
	const currentOffset = includeCurrentInstallment ? 1 : 0;

	return Math.max(0, installmentCount - currentInstallment + currentOffset);
};

const calculateInstallmentRemainingAmount = (
	amount: number,
	currentInstallment: number | null,
	installmentCount: number | null,
	isSettled: boolean | null,
) =>
	amount *
	calculateInstallmentRemainingCount(
		currentInstallment,
		installmentCount,
		isSettled,
	);

const formatInstallmentEndDate = (
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

	const month = new Intl.DateTimeFormat("pt-BR", {
		month: "short",
		timeZone: "UTC",
	}).format(lastDate);

	return `${capitalize(month)} de ${lastDate.getFullYear()}`;
};

const buildInstallmentProgress = (
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
	const { amount, currentInstallment, installmentCount, isSettled, period } =
		expense;

	return {
		compactLabel: buildInstallmentCompactLabel(
			currentInstallment,
			installmentCount,
		),
		isLast: isInstallmentLast(currentInstallment, installmentCount),
		remainingLabel: isSettled === true ? "Próximas" : "Em aberto",
		remainingInstallments: calculateInstallmentRemainingCount(
			currentInstallment,
			installmentCount,
			isSettled,
		),
		remainingAmount: calculateInstallmentRemainingAmount(
			amount,
			currentInstallment,
			installmentCount,
			isSettled,
		),
		endDate: formatInstallmentEndDate(
			period,
			currentInstallment,
			installmentCount,
		),
		progress: buildInstallmentProgress(currentInstallment, installmentCount),
	};
};
