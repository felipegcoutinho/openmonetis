"use client";

import { RiShoppingBag3Line } from "@remixicon/react";
import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";

type CardTopExpensesProps = {
	data: CardDetailData["topExpenses"];
};

export function CardTopExpenses({ data }: CardTopExpensesProps) {
	if (data.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-1.5 text-base">
						<RiShoppingBag3Line className="size-4 text-primary" />
						Top 10 Gastos do Mês
					</CardTitle>
				</CardHeader>
				<CardContent>
					<WidgetEmptyState
						icon={
							<RiShoppingBag3Line className="size-6 text-muted-foreground" />
						}
						title="Nenhum gasto encontrado"
						description="Quando houver gastos registrados, eles aparecerão aqui."
					/>
				</CardContent>
			</Card>
		);
	}

	const maxAmount = Math.max(...data.map((e) => e.amount));

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-1.5 text-base">
					<RiShoppingBag3Line className="size-4 text-primary" />
					Top 10 Gastos do Mês
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex flex-col">
					{data.map((expense, index) => (
						<div
							key={expense.id}
							className="flex flex-col py-2 border-b border-dashed last:border-0"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex min-w-0 flex-1 items-center gap-2">
									{/* Rank number */}
									<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
										<span className="text-sm font-semibold text-muted-foreground">
											{index + 1}
										</span>
									</div>

									{/* Name and details */}
									<div className="min-w-0 flex-1">
										<span className="text-sm font-medium truncate block">
											{expense.name}
										</span>
										<div className="flex items-center gap-1 mt-0.5 flex-wrap">
											<span className="text-xs text-muted-foreground">
												{expense.date}
											</span>
											{expense.category && (
												<Badge
													variant="secondary"
													className="text-xs px-1.5 py-0 h-5"
												>
													{expense.category}
												</Badge>
											)}
										</div>
									</div>
								</div>

								{/* Value */}
								<div className="flex shrink-0 flex-col items-end">
									<MoneyValues
										className="text-foreground"
										amount={expense.amount}
									/>
								</div>
							</div>

							{/* Progress bar */}
							<div className="ml-12 mt-1.5">
								<Progress
									className="h-1.5"
									value={(expense.amount / maxAmount) * 100}
								/>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
