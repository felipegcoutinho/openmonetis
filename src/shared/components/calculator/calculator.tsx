"use client";

import { CalculatorKeypad } from "@/shared/components/calculator/calculator-keypad";
import { Button } from "@/shared/components/ui/button";
import { useCalculatorKeyboard } from "@/shared/lib/calculator/use-calculator-keyboard";
import { useCalculatorState } from "@/shared/lib/calculator/use-calculator-state";
import { CalculatorDisplay } from "./calculator-display";

type CalculatorProps = {
	isOpen?: boolean;
	onSelectValue?: (value: string) => void;
};

export default function Calculator({
	isOpen = true,
	onSelectValue,
}: CalculatorProps) {
	const {
		display,
		operator,
		expression,
		history,
		resultText,
		copied,
		buttons,
		inputDigit,
		inputDecimal,
		setNextOperator,
		evaluate,
		deleteLastDigit,
		reset,
		applyPercent,
		copyToClipboard,
		pasteFromClipboard,
	} = useCalculatorState();

	useCalculatorKeyboard({
		isOpen,
		canCopy: Boolean(resultText),
		onCopy: copyToClipboard,
		onPaste: pasteFromClipboard,
		inputDigit,
		inputDecimal,
		setNextOperator,
		evaluate,
		deleteLastDigit,
		reset,
		applyPercent,
	});

	const canUseValue = onSelectValue && display !== "Erro" && display !== "0";

	const handleSelectValue = () => {
		if (!onSelectValue) return;
		const numericValue = Math.abs(Number(display)).toFixed(2);
		onSelectValue(numericValue);
	};

	return (
		<div className="space-y-4">
			<CalculatorDisplay
				history={history}
				expression={expression}
				resultText={resultText}
				copied={copied}
				onCopy={copyToClipboard}
				isResultView={Boolean(history)}
			/>
			<CalculatorKeypad buttons={buttons} activeOperator={operator} />
			{onSelectValue && (
				<Button
					type="button"
					variant="default"
					className="w-full"
					disabled={!canUseValue}
					onClick={handleSelectValue}
				>
					Usar valor
				</Button>
			)}
		</div>
	);
}
