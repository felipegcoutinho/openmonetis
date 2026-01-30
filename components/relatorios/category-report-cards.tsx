"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	CategoryReportData,
	CategoryReportItem,
} from "@/lib/relatorios/types";
import { formatCurrency, formatPeriodLabel } from "@/lib/relatorios/utils";
import { formatPeriodForUrl } from "@/lib/utils/period";
import { CategoryCell } from "./category-cell";

interface CategoryReportCardsProps {
	data: CategoryReportData;
}

interface CategoryCardProps {
	category: CategoryReportItem;
	periods: string[];
	colorIndex: number;
}

function CategoryCard({ category, periods, colorIndex }: CategoryCardProps) {
	const periodParam = formatPeriodForUrl(periods[periods.length - 1]);

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-3">
					<CategoryIconBadge
						icon={category.icon}
						name={category.name}
						colorIndex={colorIndex}
					/>
					<Link
						href={`/categorias/${category.categoryId}?periodo=${periodParam}`}
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
	colorIndexOffset: number;
	total: number;
}

function Section({
	title,
	categories,
	periods,
	colorIndexOffset,
	total,
}: SectionProps) {
	if (categories.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					{title}
				</span>
				<span className="text-sm text-muted-foreground">
					{formatCurrency(total)}
				</span>
			</div>
			{categories.map((category, index) => (
				<CategoryCard
					key={category.categoryId}
					category={category}
					periods={periods}
					colorIndex={colorIndexOffset + index}
				/>
			))}
		</div>
	);
}

export function CategoryReportCards({ data }: CategoryReportCardsProps) {
	const { categories, periods } = data;

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
				colorIndexOffset={0}
				total={despesasTotal}
			/>

			{/* Receitas Section */}
			<Section
				title="Receitas"
				categories={receitas}
				periods={periods}
				colorIndexOffset={despesas.length}
				total={receitasTotal}
			/>
		</div>
	);
}
