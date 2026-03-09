"use client";

import type { IncomeByCategoryData } from "@/lib/dashboard/categories/income-by-category";
import { CategoryBreakdownWidgetView } from "./category-breakdown/category-breakdown-widget-view";

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
