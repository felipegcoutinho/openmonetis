"use client";

import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import { formatPercentageChange } from "@/features/reports/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

interface CategoryCellProps {
	value: number;
	previousValue: number;
	categoryType: "despesa" | "receita";
	isFirstMonth: boolean;
}

export function CategoryCell({
	value,
	previousValue,
	categoryType,
	isFirstMonth,
}: CategoryCellProps) {
	const percentageChange =
		!isFirstMonth && previousValue !== 0
			? ((value - previousValue) / previousValue) * 100
			: null;

	const absoluteChange = !isFirstMonth ? value - previousValue : null;

	// Despesa: aumento é ruim (vermelho), diminuição é bom (verde)
	// Receita: aumento é bom (verde), diminuição é ruim (vermelho)
	const positiveTrend = categoryType === "receita" ? "up" : "down";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex flex-col items-end gap-0.5 min-h-9 justify-center cursor-default px-4 py-2">
					<span className="font-medium">{formatCurrency(value)}</span>
					{!isFirstMonth && percentageChange !== null && (
						<PercentageChangeIndicator
							value={percentageChange}
							label={formatPercentageChange(percentageChange)}
							positiveTrend={positiveTrend}
							iconClassName="h-3 w-3"
						/>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent side="top" className="text-xs">
				<div className="flex flex-col gap-1">
					<div className="font-medium">{formatCurrency(value)}</div>
					{!isFirstMonth && absoluteChange !== null && (
						<>
							<div className="font-medium">
								Mês anterior: {formatCurrency(previousValue)}
							</div>
							<div
								className={cn(
									"font-medium",
									(positiveTrend === "up"
										? absoluteChange !== null && absoluteChange < 0
										: absoluteChange !== null && absoluteChange > 0) &&
										"text-destructive",
									(positiveTrend === "up"
										? absoluteChange !== null && absoluteChange > 0
										: absoluteChange !== null && absoluteChange < 0) &&
										"text-success",
								)}
							>
								Diferença:{" "}
								{absoluteChange >= 0
									? `+${formatCurrency(absoluteChange)}`
									: formatCurrency(absoluteChange)}
							</div>
						</>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
