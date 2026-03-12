import { Button } from "@/shared/components/ui/button";
import type { CalculatorButtonConfig } from "@/shared/lib/calculator/use-calculator-state";
import type { Operator } from "@/shared/utils/calculator";
import { cn } from "@/shared/utils/ui";

type CalculatorKeypadProps = {
	buttons: CalculatorButtonConfig[][];
	activeOperator: Operator | null;
};

const LABEL_TO_OPERATOR: Record<string, Operator> = {
	"÷": "divide",
	"×": "multiply",
	"-": "subtract",
	"+": "add",
};

export function CalculatorKeypad({
	buttons,
	activeOperator,
}: CalculatorKeypadProps) {
	return (
		<div className="grid grid-cols-4 gap-2">
			{buttons.flat().map((btn, index) => {
				const op = LABEL_TO_OPERATOR[btn.label];
				const isActive = op != null && op === activeOperator;

				return (
					<Button
						key={`${btn.label}-${index}`}
						type="button"
						variant={isActive ? "default" : (btn.variant ?? "outline")}
						onClick={btn.onClick}
						className={cn(
							"h-12 text-base font-semibold",
							btn.colSpan === 2 && "col-span-2",
							btn.colSpan === 3 && "col-span-3",
							isActive &&
								"bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30",
							btn.className,
						)}
					>
						{btn.label}
					</Button>
				);
			})}
		</div>
	);
}
