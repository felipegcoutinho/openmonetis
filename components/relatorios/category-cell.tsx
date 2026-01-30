"use client";

import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatPercentageChange } from "@/lib/relatorios/utils";
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

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex flex-col items-end gap-0.5 min-h-9 justify-center cursor-default px-4 py-2">
					<span className="font-medium">{formatCurrency(value)}</span>
					{!isFirstMonth && percentageChange !== null && (
						<div
							className={cn(
								"flex items-center gap-0.5 text-xs",
								isIncrease && "text-red-600 dark:text-red-400",
								isDecrease && "text-green-600 dark:text-green-400",
							)}
						>
							{isIncrease && <RiArrowUpLine className="h-3 w-3" />}
							{isDecrease && <RiArrowDownLine className="h-3 w-3" />}
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
									isIncrease && "text-red-500",
									isDecrease && "text-green-500",
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
