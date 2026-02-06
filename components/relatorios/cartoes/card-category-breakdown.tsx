"use client";

import { RiPieChartLine } from "@remixicon/react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import MoneyValues from "@/components/money-values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";

type CardCategoryBreakdownProps = {
	data: CardDetailData["categoryBreakdown"];
};

export function CardCategoryBreakdown({ data }: CardCategoryBreakdownProps) {
	if (data.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-1.5 text-base">
						<RiPieChartLine className="size-4 text-primary" />
						Gastos por Categoria
					</CardTitle>
				</CardHeader>
				<CardContent>
					<WidgetEmptyState
						icon={<RiPieChartLine className="size-6 text-muted-foreground" />}
						title="Nenhuma categoria encontrada"
						description="Quando houver despesas categorizadas, elas aparecerão aqui."
					/>
				</CardContent>
			</Card>
		);
	}

	const _totalAmount = data.reduce((acc, c) => acc + c.amount, 0);

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-1.5 text-base">
					<RiPieChartLine className="size-4 text-primary" />
					Gastos por Categoria
				</CardTitle>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="flex flex-col">
					{data.map((category, index) => (
						<div
							key={category.id}
							className="flex flex-col py-2 border-b border-dashed last:border-0"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<CategoryIconBadge
										icon={category.icon}
										name={category.name}
										colorIndex={index}
									/>

									{/* Name and percentage */}
									<div className="min-w-0 flex-1">
										<span className="text-sm font-medium truncate block">
											{category.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{category.percent.toFixed(0)}% do total
										</span>
									</div>
								</div>

								{/* Value */}
								<div className="flex shrink-0 flex-col items-end">
									<MoneyValues
										className="text-foreground"
										amount={category.amount}
									/>
								</div>
							</div>

							{/* Progress bar */}
							<div className="ml-11 mt-1.5">
								<Progress className="h-1.5" value={category.percent} />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
