"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatPeriodLabel } from "@/features/reports/utils";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import type {
	CategoryReportData,
	CategoryReportItem,
} from "@/shared/lib/types/reports";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { CategoryCell } from "./category-cell";

interface CategoryReportCardsProps {
	data: CategoryReportData;
}

interface CategoryCardProps {
	category: CategoryReportItem;
	periods: string[];
	periodCount: number;
}

function CategoryCard({ category, periods, periodCount }: CategoryCardProps) {
	const periodParam = formatPeriodForUrl(periods[periods.length - 1]);
	const averageMonthlyTotal = category.total / periodCount;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-3">
					<CategoryIconBadge icon={category.icon} name={category.name} />
					<Link
						href={`/categories/${category.categoryId}?periodo=${periodParam}`}
						className="flex-1 truncate hover:underline underline-offset-2"
					>
						{category.name}
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{periods.map((period, periodIndex) => {
					const monthData = category.monthlyData.get(period);
					const isFirstMonth = periodIndex === 0;

					return (
						<div
							key={period}
							className="flex items-center justify-between py-2 border-b last:border-b-0"
						>
							<span className="text-sm text-muted-foreground">
								{formatPeriodLabel(period)}
							</span>
							<CategoryCell
								value={monthData?.amount ?? 0}
								previousValue={monthData?.previousAmount ?? 0}
								categoryType={category.type}
								isFirstMonth={isFirstMonth}
							/>
						</div>
					);
				})}
				<div className="flex items-center justify-between font-semibold text-info">
					<span>Média mensal</span>
					<span>{formatCurrency(averageMonthlyTotal)}</span>
				</div>
				<div className="flex items-center justify-between pt-2 font-semibold">
					<span>Total</span>
					<span>{formatCurrency(category.total)}</span>
				</div>
			</CardContent>
		</Card>
	);
}

interface SectionProps {
	title: string;
	categories: CategoryReportItem[];
	periods: string[];
	periodCount: number;
	total: number;
}

function Section({
	title,
	categories,
	periods,
	periodCount,
	total,
}: SectionProps) {
	if (categories.length === 0) {
		return null;
	}

	const averageMonthlyTotal = total / periodCount;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					{title}
				</span>
				<div className="flex flex-col items-end">
					<span className="text-sm text-muted-foreground">
						{formatCurrency(total)}
					</span>
					<span className="text-xs font-semibold text-info">
						Média: {formatCurrency(averageMonthlyTotal)}
					</span>
				</div>
			</div>
			{categories.map((category, index) => (
				<CategoryCard
					key={category.categoryId}
					category={category}
					periods={periods}
					periodCount={periodCount}
				/>
			))}
		</div>
	);
}

export function CategoryReportCards({ data }: CategoryReportCardsProps) {
	const { categories, periods } = data;
	const periodCount = Math.max(periods.length, 1);

	// Separate categories by type and calculate totals
	const { receitas, despesas, receitasTotal, despesasTotal } = useMemo(() => {
		const receitas: CategoryReportItem[] = [];
		const despesas: CategoryReportItem[] = [];
		let receitasTotal = 0;
		let despesasTotal = 0;

		for (const category of categories) {
			if (category.type === "receita") {
				receitas.push(category);
				receitasTotal += category.total;
			} else {
				despesas.push(category);
				despesasTotal += category.total;
			}
		}

		return { receitas, despesas, receitasTotal, despesasTotal };
	}, [categories]);

	return (
		<div className="md:hidden space-y-6">
			{/* Despesas Section */}
			<Section
				title="Despesas"
				categories={despesas}
				periods={periods}
				periodCount={periodCount}
				total={despesasTotal}
			/>

			{/* Receitas Section */}
			<Section
				title="Receitas"
				categories={receitas}
				periods={periods}
				periodCount={periodCount}
				total={receitasTotal}
			/>
		</div>
	);
}
