"use client";

import { RiArrowDownSFill, RiArrowUpSFill } from "@remixicon/react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/lancamentos/formatting-helpers";
import { formatPercentageChange } from "@/lib/relatorios/utils";
import { cn } from "@/lib/utils/ui";

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

	const isIncrease = percentageChange !== null && percentageChange > 0;
	const isDecrease = percentageChange !== null && percentageChange < 0;

	// Despesa: aumento é ruim (vermelho), diminuição é bom (verde)
	// Receita: aumento é bom (verde), diminuição é ruim (vermelho)
	const isPositive = categoryType === "receita" ? isIncrease : isDecrease;
	const isNegative = categoryType === "receita" ? isDecrease : isIncrease;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex flex-col items-end gap-0.5 min-h-9 justify-center cursor-default px-4 py-2">
					<span className="font-medium">{formatCurrency(value)}</span>
					{!isFirstMonth && percentageChange !== null && (
						<div
							className={cn(
								"flex items-center gap-0.5 text-xs",
								isNegative && "text-destructive",
								isPositive && "text-success",
							)}
						>
							{isIncrease && <RiArrowUpSFill className="h-3 w-3" />}
							{isDecrease && <RiArrowDownSFill className="h-3 w-3" />}
							<span>{formatPercentageChange(percentageChange)}</span>
						</div>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent side="top" className="text-xs">
				<div className="flex flex-col gap-1">
					<div className="font-medium">{formatCurrency(value)}</div>
					{!isFirstMonth && absoluteChange !== null && (
						<>
							<div className="font-bold">
								Mês anterior: {formatCurrency(previousValue)}
							</div>
							<div
								className={cn(
									"font-medium",
									isNegative && "text-destructive",
									isPositive && "text-success",
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
