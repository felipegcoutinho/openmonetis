"use client";

import {
	RiDeleteBin5Line,
	RiFileList2Line,
	RiPencilLine,
} from "@remixicon/react";
import Link from "next/link";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/ui";
import type { Budget } from "./types";

interface BudgetCardProps {
	budget: Budget;
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

export function BudgetCard({ budget, onEdit, onRemove }: BudgetCardProps) {
	const { amount: limit, spent } = budget;
	const exceeded = spent > limit && limit >= 0;
	const difference = Math.abs(spent - limit);
	const usagePercent = buildUsagePercent(spent, limit);
	const remaining = Math.max(limit - spent, 0);

	return (
		<Card className="flex w-full flex-col p-6">
			<div className="flex items-center gap-2">
				<CategoryIconBadge
					icon={budget.category?.icon ?? undefined}
					name={formatCategoryName(budget)}
					size="lg"
				/>
				<div className="min-w-0">
					<h3 className="truncate font-semibold text-foreground">
						{formatCategoryName(budget)}
					</h3>
				</div>
			</div>

			<CardContent className="flex flex-1 flex-col gap-4 p-0">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">
						{exceeded ? "Excedido em" : "Disponível"}
					</span>
					<MoneyValues
						amount={exceeded ? difference : remaining}
						className={cn(
							"text-xl font-semibold",
							exceeded ? "text-destructive" : "text-success",
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Orçamento</span>
						<MoneyValues
							amount={limit}
							className="text-sm font-semibold text-foreground"
						/>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Gasto</span>
						<MoneyValues
							amount={spent}
							className={cn(
								"text-sm font-semibold",
								exceeded ? "text-destructive" : "text-primary",
							)}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<Progress
						value={usagePercent}
						className={cn("h-2.5", exceeded && "bg-destructive/20!")}
						aria-label={`${usagePercent.toFixed(1)}% do orçamento utilizado`}
					/>
					<span className="text-xs text-muted-foreground">
						{usagePercent.toFixed(1)}% utilizado
					</span>
				</div>
			</CardContent>

			<CardFooter className="mt-auto flex flex-wrap gap-4 px-0 pt-2 text-sm">
				<button
					type="button"
					onClick={() => onEdit(budget)}
					className="flex items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80"
				>
					<RiPencilLine className="size-4" aria-hidden /> editar
				</button>
				{budget.category && (
					<Link
						href={`/categories/${budget.category.id}`}
						className="flex items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80"
					>
						<RiFileList2Line className="size-4" aria-hidden /> detalhes
					</Link>
				)}
				<button
					type="button"
					onClick={() => onRemove(budget)}
					className="flex items-center gap-1 font-medium text-destructive transition-opacity hover:opacity-80"
				>
					<RiDeleteBin5Line className="size-4" aria-hidden /> remover
				</button>
			</CardFooter>
		</Card>
	);
}
