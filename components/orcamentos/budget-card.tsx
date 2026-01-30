"use client";

import { RiDeleteBin5Line, RiPencilLine } from "@remixicon/react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import MoneyValues from "@/components/money-values";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/ui";
import type { Budget } from "./types";

interface BudgetCardProps {
	budget: Budget;
	colorIndex: number;
	periodLabel: string;
	onEdit: (budget: Budget) => void;
	onRemove: (budget: Budget) => void;
}

const buildUsagePercent = (spent: number, limit: number) => {
	if (limit <= 0) {
		return spent > 0 ? 100 : 0;
	}
	const percent = (spent / limit) * 100;
	return Math.min(Math.max(percent, 0), 100);
};

const formatCategoryName = (budget: Budget) =>
	budget.category?.name ?? "Categoria removida";

export function BudgetCard({
	budget,
	colorIndex,
	periodLabel,
	onEdit,
	onRemove,
}: BudgetCardProps) {
	const { amount: limit, spent } = budget;
	const exceeded = spent > limit && limit >= 0;
	const difference = Math.abs(spent - limit);
	const usagePercent = buildUsagePercent(spent, limit);

	return (
		<Card className="flex h-full flex-col">
			<CardContent className="flex h-full flex-col gap-4">
				<div className="flex items-start gap-3">
					<CategoryIconBadge
						icon={budget.category?.icon ?? undefined}
						name={formatCategoryName(budget)}
						colorIndex={colorIndex}
						size="lg"
					/>
					<div className="space-y-1">
						<h3 className="text-base font-semibold leading-tight">
							{formatCategoryName(budget)}
						</h3>
						<p className="text-xs text-muted-foreground">
							Orçamento de {periodLabel}
						</p>
					</div>
				</div>

				<div className="flex flex-1 flex-col gap-2">
					<div className="flex items-baseline justify-between text-sm">
						<span className="text-muted-foreground">Gasto até agora</span>
						<MoneyValues
							amount={spent}
							className={cn(exceeded && "text-destructive")}
						/>
					</div>
					<Progress
						value={usagePercent}
						className={cn("h-2", exceeded && "bg-destructive/20!")}
					/>
					<div className="flex flex-wrap items-baseline justify-between gap-1 text-sm">
						<span className="text-muted-foreground">Limite</span>
						<MoneyValues amount={limit} className="text-foreground" />
					</div>

					<div className="mt-2">
						{exceeded ? (
							<div className="text-xs text-red-500">
								Excedeu em <MoneyValues amount={difference} />
							</div>
						) : (
							<div className="text-sm text-green-600">
								Restam <MoneyValues amount={Math.max(limit - spent, 0)} />{" "}
								disponíveis.
							</div>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-wrap gap-3 px-5 text-sm">
				<button
					type="button"
					onClick={() => onEdit(budget)}
					className="flex items-center gap-1 text-primary font-medium transition-opacity hover:opacity-80"
				>
					<RiPencilLine className="size-4" aria-hidden /> editar
				</button>
				<button
					type="button"
					onClick={() => onRemove(budget)}
					className="flex items-center gap-1 text-destructive font-medium transition-opacity hover:opacity-80"
				>
					<RiDeleteBin5Line className="size-4" aria-hidden /> remover
				</button>
			</CardFooter>
		</Card>
	);
}
