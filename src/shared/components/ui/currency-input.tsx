"use client";

import * as React from "react";

import { cn } from "@/shared/utils/ui";
import { Input } from "./input";

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const digitsToDecimalString = (digits: string) => {
	const sanitized = digits.replace(/\D/g, "");
	if (sanitized.length === 0) {
		return "";
	}

	const padded = sanitized.padStart(3, "0");
	const integerPart = padded.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
	const fractionPart = padded.slice(-2);

	return `${integerPart}.${fractionPart}`;
};

const decimalToDigits = (value: string | undefined | null) => {
	if (!value) {
		return "";
	}

	const normalized = value.toString().replace(/\s/g, "").replace(",", ".");
	const numeric = Number(normalized);

	if (Number.isNaN(numeric)) {
		return "";
	}

	const cents = Math.round(Math.abs(numeric) * 100);
	return cents === 0 ? "0" : cents.toString();
};

const formatDigits = (digits: string) => {
	if (digits.length === 0) {
		return "";
	}

	const decimal = digitsToDecimalString(digits);
	const numeric = Number(decimal);

	if (Number.isNaN(numeric)) {
		return "";
	}

	return BRL_FORMATTER.format(numeric);
};

interface CurrencyInputProps
	extends Omit<
		React.ComponentProps<typeof Input>,
		"value" | "defaultValue" | "type" | "inputMode" | "onChange"
	> {
	value: string;
	onValueChange: (value: string) => void;
	onChange?: React.ComponentProps<typeof Input>["onChange"];
}

export const CurrencyInput = React.forwardRef<
	HTMLInputElement,
	CurrencyInputProps
>(({ className, value, onValueChange, onBlur, onChange, ...props }, ref) => {
	const digits = React.useMemo(() => decimalToDigits(value), [value]);
	const displayValue = React.useMemo(() => formatDigits(digits), [digits]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = event.target.value;
		const nextDigits = rawValue.replace(/\D/g, "");

		if (nextDigits.length === 0) {
			onValueChange("");
		} else {
			onValueChange(digitsToDecimalString(nextDigits));
		}

		onChange?.(event);
	};

	return (
		<Input
			{...props}
			ref={ref}
			type="text"
			inputMode="decimal"
			value={displayValue}
			onChange={handleChange}
			onBlur={onBlur}
			className={cn("text-left tracking-tight", className)}
		/>
	);
});

CurrencyInput.displayName = "CurrencyInput";
