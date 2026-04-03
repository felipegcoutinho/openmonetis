import {
	buildDateOnlyStringFromPeriodDay,
	formatDateOnlyLabel,
	getBusinessDateString,
	parseUtcDateString,
	toDateOnlyString,
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

type RelativeFinancialDateContext = "due" | "paid";

export function formatFinancialDateLabel(
	value: string | null,
	prefix?: string,
	options?: Intl.DateTimeFormatOptions,
): string | null {
	return formatDateOnlyLabel(value, prefix, options);
}

function getOffsetDateString(
	referenceDate: string,
	offset: number,
): string | null {
	const parsedReference = parseUtcDateString(referenceDate);
	if (!parsedReference) {
		return null;
	}

	parsedReference.setUTCDate(parsedReference.getUTCDate() + offset);
	return toDateOnlyString(parsedReference);
}

export function formatRelativeFinancialDateLabel(
	value: string | null,
	context: RelativeFinancialDateContext,
	options?: {
		referenceDate?: string | Date | null;
	},
): string | null {
	const normalizedValue = toDateOnlyString(value);
	if (!normalizedValue) {
		return null;
	}

	const referenceDate =
		toDateOnlyString(options?.referenceDate) ?? getBusinessDateString();
	const yesterday = getOffsetDateString(referenceDate, -1);
	const tomorrow = getOffsetDateString(referenceDate, 1);

	if (context === "due") {
		if (normalizedValue === referenceDate) {
			return "Vence hoje";
		}

		if (normalizedValue === tomorrow) {
			return "Vence amanhã";
		}

		if (normalizedValue === yesterday) {
			return "Venceu ontem";
		}

		return formatFinancialDateLabel(normalizedValue, "Vence em");
	}

	if (normalizedValue === referenceDate) {
		return "Pago hoje";
	}

	if (normalizedValue === yesterday) {
		return "Pago ontem";
	}

	return formatFinancialDateLabel(normalizedValue, "Pago em");
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

export function buildRelativeFinancialStatusLabel({
	isSettled,
	dueDate,
	paidAt,
}: FinancialStatusLabelInput): string | null {
	if (isSettled) {
		return formatRelativeFinancialDateLabel(paidAt, "paid");
	}

	return formatRelativeFinancialDateLabel(dueDate, "due");
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

export function buildRelativeDueDateInfoFromPeriodDay(
	period: string,
	dueDay: string,
	options?: {
		fallbackPrefix?: string;
	},
): FinancialDueDateInfo {
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
			formatRelativeFinancialDateLabel(dueDate, "due") ??
			`${fallbackPrefix} ${dueDay}`,
		date: dueDate,
	};
}
