"use client";

import type { ExpensesByCategoryData } from "@/features/dashboard/categories/expenses-by-category-queries";
import { CategoryBreakdownWidgetView } from "../category-breakdown/category-breakdown-widget-view";

type ExpensesByCategoryWidgetWithChartProps = {
	data: ExpensesByCategoryData;
	period: string;
};

export function ExpensesByCategoryWidgetWithChart({
	data,
	period,
}: ExpensesByCategoryWidgetWithChartProps) {
	return (
		<CategoryBreakdownWidgetView
			data={data}
			period={period}
			variant="expense"
		/>
	);
}
