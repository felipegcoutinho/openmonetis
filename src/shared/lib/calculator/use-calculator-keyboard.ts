import { useEffect } from "react";
import type { Operator } from "@/shared/utils/calculator";

type UseCalculatorKeyboardParams = {
	isOpen: boolean;
	canCopy: boolean;
	onCopy: () => void | Promise<void>;
	onPaste: () => void | Promise<void>;
	inputDigit: (digit: string) => void;
	inputDecimal: () => void;
	setNextOperator: (op: Operator) => void;
	evaluate: () => void;
	deleteLastDigit: () => void;
	reset: () => void;
	applyPercent: () => void;
};

function shouldIgnoreForEditableTarget(target: EventTarget | null): boolean {
	if (!target || !(target instanceof HTMLElement)) {
		return false;
	}

	const tagName = target.tagName;
	return (
		tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable
	);
}

const KEY_TO_OPERATOR: Record<string, Operator> = {
	"+": "add",
	"-": "subtract",
	"*": "multiply",
	"/": "divide",
};

export function useCalculatorKeyboard({
	isOpen,
	canCopy,
	onCopy,
	onPaste,
	inputDigit,
	inputDecimal,
	setNextOperator,
	evaluate,
	deleteLastDigit,
	reset,
	applyPercent,
}: UseCalculatorKeyboardParams) {
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			const { key, ctrlKey, metaKey } = event;

			// Ctrl/Cmd shortcuts
			if (ctrlKey || metaKey) {
				if (shouldIgnoreForEditableTarget(event.target)) return;

				const lowerKey = key.toLowerCase();
				if (lowerKey === "c" && canCopy) {
					const selection = window.getSelection();
					if (selection && selection.toString().trim().length > 0) return;
					event.preventDefault();
					void onCopy();
				} else if (lowerKey === "v") {
					const selection = window.getSelection();
					if (selection && selection.toString().trim().length > 0) return;
					if (!navigator.clipboard?.readText) return;
					event.preventDefault();
					void onPaste();
				}
				return;
			}

			// Digits
			if (key >= "0" && key <= "9") {
				event.preventDefault();
				inputDigit(key);
				return;
			}

			// Decimal
			if (key === "." || key === ",") {
				event.preventDefault();
				inputDecimal();
				return;
			}

			// Operators
			const op = KEY_TO_OPERATOR[key];
			if (op) {
				event.preventDefault();
				setNextOperator(op);
				return;
			}

			// Evaluate
			if (key === "Enter" || key === "=") {
				event.preventDefault();
				evaluate();
				return;
			}

			// Backspace
			if (key === "Backspace") {
				event.preventDefault();
				deleteLastDigit();
				return;
			}

			// Escape resets calculator (dialog close is handled by onEscapeKeyDown)
			if (key === "Escape") {
				event.preventDefault();
				reset();
				return;
			}

			// Percent
			if (key === "%") {
				event.preventDefault();
				applyPercent();
				return;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		isOpen,
		canCopy,
		onCopy,
		onPaste,
		inputDigit,
		inputDecimal,
		setNextOperator,
		evaluate,
		deleteLastDigit,
		reset,
		applyPercent,
	]);
}
