"use client";

import { RiArrowUpDoubleLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import type {
	TopExpense,
	TopExpensesData,
} from "@/features/dashboard/expenses/top-expenses-queries";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { Switch } from "@/shared/components/ui/switch";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { formatTransactionDate } from "@/shared/utils/date";

type TopExpensesWidgetProps = {
	allExpenses: TopExpensesData;
	cardOnlyExpenses: TopExpensesData;
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

const isCardExpense = (expense: TopExpense) =>
	expense.paymentMethod?.toLowerCase().includes("cartão") ?? false;

export function TopExpensesWidget({
	allExpenses,
	cardOnlyExpenses,
}: TopExpensesWidgetProps) {
	const [cardOnly, setCardOnly] = useState(false);
	const normalizedAllExpenses = useMemo(() => {
		return allExpenses.expenses.filter(shouldIncludeExpense);
	}, [allExpenses]);

	const normalizedCardOnlyExpenses = useMemo(() => {
		const merged = [...cardOnlyExpenses.expenses, ...normalizedAllExpenses];
		const seen = new Set<string>();

		return merged.filter((expense) => {
			if (seen.has(expense.id)) {
				return false;
			}

			if (!isCardExpense(expense) || !shouldIncludeExpense(expense)) {
				return false;
			}

			seen.add(expense.id);
			return true;
		});
	}, [cardOnlyExpenses, normalizedAllExpenses]);

	const data = cardOnly
		? { expenses: normalizedCardOnlyExpenses }
		: { expenses: normalizedAllExpenses };

	return (
		<div className="flex flex-col gap-4 px-0">
			<div className="flex items-center justify-between gap-3">
				<label
					htmlFor="card-only-toggle"
					className="text-sm text-muted-foreground"
				>
					Apenas cartões
				</label>
				<Switch
					id="card-only-toggle"
					checked={cardOnly}
					onCheckedChange={setCardOnly}
				/>
			</div>

			{data.expenses.length === 0 ? (
				<div className="-mt-10">
					<WidgetEmptyState
						icon={
							<RiArrowUpDoubleLine className="size-6 text-muted-foreground" />
						}
						title="Nenhuma despesa encontrada"
						description="Quando houver despesas registradas, elas aparecerão aqui."
					/>
				</div>
			) : (
				<div className="flex flex-col">
					{data.expenses.map((expense) => {
						return (
							<div
								key={expense.id}
								className="flex items-center justify-between gap-3 transition-all duration-300 py-2"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
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
									<MoneyValues amount={expense.amount} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
