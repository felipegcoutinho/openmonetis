"use client";

import { usePrivacyMode } from "@/shared/components/providers/privacy-provider";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

type Props = {
	amount: number;
	className?: string;
	showPositiveSign?: boolean;
};

function MoneyValues({ amount, className, showPositiveSign = false }: Props) {
	const { privacyMode } = usePrivacyMode();
	const formattedValue = formatCurrency(amount);

	const displayValue =
		showPositiveSign && amount > 0 ? `+${formattedValue}` : formattedValue;

	return (
		<span
			className={cn(
				"inline-flex items-baseline tabular-nums transition-all duration-200 tracking-tighter",
				privacyMode &&
					"blur-sm select-none hover:blur-none focus-within:blur-none",
				className,
			)}
			aria-label={privacyMode ? "Valor oculto" : displayValue}
			data-privacy={privacyMode ? "hidden" : undefined}
			title={
				privacyMode ? "Valor oculto - passe o mouse para revelar" : undefined
			}
		>
			{displayValue}
		</span>
	);
}

export default MoneyValues;
