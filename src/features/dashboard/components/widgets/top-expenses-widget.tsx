"use client";

import { RiArrowUpDoubleLine } from "@remixicon/react";
import { useMemo } from "react";
import type {
	TopExpense,
	TopExpensesData,
} from "@/features/dashboard/expenses/top-expenses-queries";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { formatTransactionDate } from "@/shared/utils/date";

type TopExpensesWidgetProps = {
	data: TopExpensesData;
};

const shouldIncludeExpense = (expense: TopExpense) => {
	const normalizedName = expense.name.trim().toLowerCase();

	if (normalizedName === "saldo inicial") {
		return false;
	}

	if (normalizedName.includes("fatura")) {
		return false;
	}

	return true;
};

export function TopExpensesWidget({ data }: TopExpensesWidgetProps) {
	const expenses = useMemo(
		() => data.expenses.filter(shouldIncludeExpense),
		[data.expenses],
	);

	return (
		<div className="flex flex-col px-0">
			{expenses.length === 0 ? (
				<WidgetEmptyState
					icon={
						<RiArrowUpDoubleLine className="size-6 text-muted-foreground" />
					}
					title="Nenhuma despesa encontrada"
					description="Quando houver despesas registradas, elas aparecerão aqui."
				/>
			) : (
				<div className="flex flex-col">
					{expenses.map((expense, index) => {
						return (
							<div
								key={expense.id}
								className="flex items-center justify-between gap-2 transition-all duration-300 py-1.5"
							>
								<span className="w-3 shrink-0 text-left text-xs font-medium text-muted-foreground">
									{index + 1}
								</span>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<EstablishmentLogo name={expense.name} size={37} />

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{expense.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatTransactionDate(expense.purchaseDate)}
										</p>
									</div>
								</div>

								<div className="shrink-0 text-foreground">
									<MoneyValues
										className="font-medium"
										amount={expense.amount}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
