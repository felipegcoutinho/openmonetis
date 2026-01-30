"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { CategoryReportItem } from "@/lib/relatorios/types";
import { formatCurrency, formatPeriodLabel } from "@/lib/relatorios/utils";
import { formatPeriodForUrl } from "@/lib/utils/period";
import DotIcon from "../dot-icon";
import { Card } from "../ui/card";
import { CategoryCell } from "./category-cell";

export interface CategoryTableProps {
	title: string;
	categories: CategoryReportItem[];
	periods: string[];
	colorIndexOffset: number;
}

export function CategoryTable({
	title,
	categories,
	periods,
	colorIndexOffset,
}: CategoryTableProps) {
	// Calculate section totals
	const sectionTotals = useMemo(() => {
		const totalsMap = new Map<string, number>();
		let grandTotal = 0;

		for (const category of categories) {
			grandTotal += category.total;
			for (const period of periods) {
				const monthData = category.monthlyData.get(period);
				const current = totalsMap.get(period) ?? 0;
				totalsMap.set(period, current + (monthData?.amount ?? 0));
			}
		}

		return { totalsMap, grandTotal };
	}, [categories, periods]);

	if (categories.length === 0) {
		return null;
	}

	return (
		<Card className="px-6 py-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[280px] min-w-[280px] font-bold">
							Categoria
						</TableHead>
						{periods.map((period) => (
							<TableHead
								key={period}
								className="text-right min-w-[120px] font-bold"
							>
								{formatPeriodLabel(period)}
							</TableHead>
						))}
						<TableHead className="text-right min-w-[120px] font-bold">
							Total
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{categories.map((category, index) => {
						const colorIndex = colorIndexOffset + index;
						const periodParam = formatPeriodForUrl(periods[periods.length - 1]);

						return (
							<TableRow key={category.categoryId}>
								<TableCell>
									<div className="flex items-center gap-2">
										<DotIcon
											color={
												category.type === "receita"
													? "bg-green-600"
													: "bg-red-600"
											}
										/>

										<CategoryIconBadge
											icon={category.icon}
											name={category.name}
											colorIndex={colorIndex}
										/>
										<Link
											href={`/categorias/${category.categoryId}?periodo=${periodParam}`}
											className="flex items-center gap-1.5 truncate hover:underline underline-offset-2"
										>
											{category.name}
										</Link>
									</div>
								</TableCell>
								{periods.map((period, periodIndex) => {
									const monthData = category.monthlyData.get(period);
									const isFirstMonth = periodIndex === 0;

									return (
										<TableCell key={period} className="text-right p-0">
											<CategoryCell
												value={monthData?.amount ?? 0}
												previousValue={monthData?.previousAmount ?? 0}
												categoryType={category.type}
												isFirstMonth={isFirstMonth}
											/>
										</TableCell>
									);
								})}
								<TableCell className="text-right font-semibold">
									{formatCurrency(category.total)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell className="font-bold">Total</TableCell>
						{periods.map((period) => {
							const periodTotal = sectionTotals.totalsMap.get(period) ?? 0;
							return (
								<TableCell key={period} className="text-right font-semibold">
									{formatCurrency(periodTotal)}
								</TableCell>
							);
						})}
						<TableCell className="text-right font-semibold">
							{formatCurrency(sectionTotals.grandTotal)}
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</Card>
	);
}
