"use client";

import type { IncomeByCategoryData } from "@/features/dashboard/categories/income-by-category-queries";
import { CategoryBreakdownWidgetView } from "../category-breakdown/category-breakdown-widget-view";

type IncomeByCategoryWidgetWithChartProps = {
	data: IncomeByCategoryData;
	period: string;
};

export function IncomeByCategoryWidgetWithChart({
	data,
	period,
}: IncomeByCategoryWidgetWithChartProps) {
	return (
		<CategoryBreakdownWidgetView data={data} period={period} variant="income" />
	);
}
