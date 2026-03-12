import {
	buildDateOnlyStringFromPeriodDay,
	formatDateOnlyLabel,
} from "@/shared/utils/date";

type FinancialStatusLabelInput = {
	isSettled: boolean;
	dueDate: string | null;
	paidAt: string | null;
	paidPrefix?: string;
	duePrefix?: string;
};

type FinancialDueDateInfo = {
	label: string;
	date: string | null;
};

export function formatFinancialDateLabel(
	value: string | null,
	prefix?: string,
	options?: Intl.DateTimeFormatOptions,
): string | null {
	return formatDateOnlyLabel(value, prefix, options);
}

export function buildFinancialStatusLabel({
	isSettled,
	dueDate,
	paidAt,
	paidPrefix = "Pago em",
	duePrefix = "Vence em",
}: FinancialStatusLabelInput): string | null {
	if (isSettled) {
		return formatFinancialDateLabel(paidAt, paidPrefix);
	}

	return formatFinancialDateLabel(dueDate, duePrefix);
}

export function buildDueDateInfoFromPeriodDay(
	period: string,
	dueDay: string,
	options?: {
		prefix?: string;
		fallbackPrefix?: string;
	},
): FinancialDueDateInfo {
	const prefix = options?.prefix ?? "Vence em";
	const fallbackPrefix = options?.fallbackPrefix ?? "Vence dia";
	const dueDate = buildDateOnlyStringFromPeriodDay(period, dueDay);

	if (!dueDate) {
		return {
			label: `${fallbackPrefix} ${dueDay}`,
			date: null,
		};
	}

	return {
		label:
			formatFinancialDateLabel(dueDate, prefix) ??
			`${fallbackPrefix} ${dueDay}`,
		date: dueDate,
	};
}
