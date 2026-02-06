"use client";

import { useMemo } from "react";
import type {
	CategoryReportData,
	CategoryReportItem,
} from "@/lib/relatorios/types";
import { CategoryTable } from "./category-table";

interface CategoryReportTableProps {
	data: CategoryReportData;
}

export function CategoryReportTable({ data }: CategoryReportTableProps) {
	const { categories, periods } = data;

	// Separate categories by type
	const { receitas, despesas } = useMemo(() => {
		const receitas: CategoryReportItem[] = [];
		const despesas: CategoryReportItem[] = [];

		for (const category of categories) {
			if (category.type === "receita") {
				receitas.push(category);
			} else {
				despesas.push(category);
			}
		}

		return { receitas, despesas };
	}, [categories]);

	return (
		<div className="flex flex-col gap-6">
			{/* Despesas Table */}
			<CategoryTable
				title="Despesas"
				categories={despesas}
				periods={periods}
				colorIndexOffset={0}
			/>

			{/* Receitas Table */}
			<CategoryTable
				title="Receitas"
				categories={receitas}
				periods={periods}
				colorIndexOffset={despesas.length}
			/>
		</div>
	);
}
