"use client";

import { formatCurrency, formatPercentageChange } from "@/lib/relatorios/utils";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
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

    const isIncrease = percentageChange !== null && percentageChange > 0;
    const isDecrease = percentageChange !== null && percentageChange < 0;

    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="font-medium">{formatCurrency(value)}</span>
            {!isFirstMonth && percentageChange !== null && (
                <div
                    className={cn(
                        "flex items-center gap-0.5 text-xs",
                        isIncrease && "text-red-600 dark:text-red-400",
                        isDecrease && "text-green-600 dark:text-green-400"
                    )}
                >
                    {isIncrease && <RiArrowUpLine className="h-3 w-3" />}
                    {isDecrease && <RiArrowDownLine className="h-3 w-3" />}
                    <span>{formatPercentageChange(percentageChange)}</span>
                </div>
            )}
        </div>
    );
}
