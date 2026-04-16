"use client";

import { RiInformationLine } from "@remixicon/react";
import Link from "next/link";
import { useMemo } from "react";
import { formatPeriodLabel } from "@/features/reports/utils";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import StatusDot from "@/shared/components/status-dot";
import { Card } from "@/shared/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { CategoryReportItem } from "@/shared/lib/types/reports";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { CategoryCell } from "./category-cell";

export interface CategoryTableProps {
	title: string;
	categories: CategoryReportItem[];
	periods: string[];
}

export function CategoryTable({
	title,
	categories,
	periods,
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

		const nonZeroPeriodCount = periods.filter(
			(p) => (totalsMap.get(p) ?? 0) > 0,
		).length;

		return {
			totalsMap,
			grandTotal,
			averageMonthlyTotal:
				nonZeroPeriodCount > 0 ? grandTotal / nonZeroPeriodCount : 0,
		};
	}, [categories, periods]);

	if (categories.length === 0) {
		return null;
	}

	return (
		<Card className="px-6 py-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[240px] min-w-[240px] font-medium">
							Categoria
						</TableHead>
						{periods.map((period) => (
							<TableHead
								key={period}
								className="text-right min-w-[120px] font-semibold"
							>
								{formatPeriodLabel(period)}
							</TableHead>
						))}
						<TableHead className="text-right min-w-[140px] font-semibold">
							<div className="flex items-center justify-end gap-1">
								Média
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="cursor-default inline-flex">
											<RiInformationLine className="size-3.5 text-muted-foreground" />
										</span>
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-[280px]">
										A média considera apenas os meses com gastos registrados
										(valores maiores que zero). Meses sem movimentação não
										entram no cálculo.
									</TooltipContent>
								</Tooltip>
							</div>
						</TableHead>
						<TableHead className="text-right min-w-[120px] font-semibold">
							Total
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{categories.map((category, index) => {
						const periodParam = formatPeriodForUrl(periods[periods.length - 1]);

						return (
							<TableRow key={category.categoryId}>
								<TableCell>
									<div className="flex items-center gap-2">
										<StatusDot
											color={
												category.type === "receita"
													? "bg-success"
													: "bg-destructive"
											}
										/>

										<CategoryIconBadge
											icon={category.icon}
											name={category.name}
										/>
										<Link
											href={`/categories/${category.categoryId}?periodo=${periodParam}`}
											className="flex items-center gap-1.5 truncate hover:underline underline-offset-2 font-semibold"
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
								<TableCell className="text-right font-semibold text-info">
									{(() => {
										const nonZeroCount = periods.filter(
											(p) => (category.monthlyData.get(p)?.amount ?? 0) > 0,
										).length;
										return formatCurrency(
											nonZeroCount > 0 ? category.total / nonZeroCount : 0,
										);
									})()}
								</TableCell>
								<TableCell className="text-right font-medium">
									{formatCurrency(category.total)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell className="font-medium">Total</TableCell>
						{periods.map((period) => {
							const periodTotal = sectionTotals.totalsMap.get(period) ?? 0;
							return (
								<TableCell key={period} className="text-right font-medium">
									{formatCurrency(periodTotal)}
								</TableCell>
							);
						})}
						<TableCell className="text-right font-semibold text-info">
							{formatCurrency(sectionTotals.averageMonthlyTotal)}
						</TableCell>
						<TableCell className="text-right font-semibold">
							{formatCurrency(sectionTotals.grandTotal)}
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</Card>
	);
}
