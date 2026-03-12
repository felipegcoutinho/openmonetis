export type Operator = "add" | "subtract" | "multiply" | "divide";

export const OPERATOR_SYMBOLS: Record<Operator, string> = {
	add: "+",
	subtract: "-",
	multiply: "×",
	divide: "÷",
};

export function formatNumber(value: number): string {
	if (!Number.isFinite(value)) {
		return "Erro";
	}

	const rounded = Number(Math.round(value * 1e10) / 1e10);
	return rounded.toString();
}

export function formatLocaleValue(rawValue: string): string {
	if (rawValue === "Erro") {
		return rawValue;
	}

	const isNegative = rawValue.startsWith("-");
	const unsignedValue = isNegative ? rawValue.slice(1) : rawValue;

	if (unsignedValue === "") {
		return isNegative ? "-0" : "0";
	}

	const hasDecimalSeparator = unsignedValue.includes(".");
	const [integerPartRaw, decimalPartRaw] = unsignedValue.split(".");

	const integerPart = integerPartRaw || "0";
	const decimalPart = hasDecimalSeparator ? (decimalPartRaw ?? "") : undefined;

	const numericInteger = Number(integerPart);
	const formattedInteger = Number.isFinite(numericInteger)
		? numericInteger.toLocaleString("pt-BR")
		: integerPart;

	if (decimalPart === undefined) {
		return `${isNegative ? "-" : ""}${formattedInteger}`;
	}

	return `${isNegative ? "-" : ""}${formattedInteger},${decimalPart}`;
}

export function performOperation(
	a: number,
	b: number,
	operator: Operator,
): number {
	switch (operator) {
		case "add":
			return a + b;
		case "subtract":
			return a - b;
		case "multiply":
			return a * b;
		case "divide":
			return b === 0 ? Infinity : a / b;
		default:
			return b;
	}
}

// Trata colagem de valores com formatação brasileira (ponto para milhar, vírgula para decimal)
// e variações simples em formato internacional.
export function normalizeClipboardNumber(rawValue: string): string | null {
	const trimmed = rawValue.trim();
	if (!trimmed) {
		return null;
	}

	const match = trimmed.match(/-?[\d.,\s]+/);
	if (!match) {
		return null;
	}

	let extracted = match[0].replace(/\s+/g, "");
	if (!extracted) {
		return null;
	}

	const isNegative = extracted.startsWith("-");
	if (isNegative) {
		extracted = extracted.slice(1);
	}

	extracted = extracted.replace(/[^\d.,]/g, "");
	if (!extracted) {
		return null;
	}

	const countOccurrences = (char: string) =>
		(extracted.match(new RegExp(`\\${char}`, "g")) ?? []).length;

	const hasComma = extracted.includes(",");
	const hasDot = extracted.includes(".");

	let decimalSeparator: "," | "." | null = null;

	if (hasComma && hasDot) {
		decimalSeparator =
			extracted.lastIndexOf(",") > extracted.lastIndexOf(".") ? "," : ".";
	} else if (hasComma) {
		const commaCount = countOccurrences(",");
		if (commaCount > 1) {
			decimalSeparator = null;
		} else {
			const digitsAfterComma =
				extracted.length - extracted.lastIndexOf(",") - 1;
			decimalSeparator =
				digitsAfterComma > 0 && digitsAfterComma <= 2 ? "," : null;
		}
	} else if (hasDot) {
		const dotCount = countOccurrences(".");
		if (dotCount > 1) {
			decimalSeparator = null;
		} else {
			const digitsAfterDot = extracted.length - extracted.lastIndexOf(".") - 1;
			const decimalCandidate = extracted.slice(extracted.lastIndexOf(".") + 1);
			const allZeros = /^0+$/.test(decimalCandidate);
			const shouldTreatAsDecimal =
				digitsAfterDot > 0 &&
				digitsAfterDot <= 3 &&
				!(digitsAfterDot === 3 && allZeros);
			decimalSeparator = shouldTreatAsDecimal ? "." : null;
		}
	}

	let integerPart = extracted;
	let decimalPart = "";

	if (decimalSeparator) {
		const decimalIndex = extracted.lastIndexOf(decimalSeparator);
		integerPart = extracted.slice(0, decimalIndex);
		decimalPart = extracted.slice(decimalIndex + 1);
	}

	integerPart = integerPart.replace(/[^\d]/g, "");
	decimalPart = decimalPart.replace(/[^\d]/g, "");

	if (!integerPart) {
		integerPart = "0";
	}

	let normalized = integerPart;
	if (decimalPart) {
		normalized = `${integerPart}.${decimalPart}`;
	}

	if (isNegative && Number(normalized) !== 0) {
		normalized = `-${normalized}`;
	}

	if (!/^(-?\d+(\.\d+)?)$/.test(normalized)) {
		return null;
	}

	const numericValue = Number(normalized);
	if (!Number.isFinite(numericValue)) {
		return null;
	}

	return normalized;
}
