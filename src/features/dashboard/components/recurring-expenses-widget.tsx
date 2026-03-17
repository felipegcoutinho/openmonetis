import { RiRefreshLine } from "@remixicon/react";
import type { RecurringExpensesData } from "@/features/dashboard/expenses/recurring-expenses-queries";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";

type RecurringExpensesWidgetProps = {
	data: RecurringExpensesData;
};

const formatOccurrences = (value: number | null) => {
	if (!value) {
		return "Recorrência contínua";
	}

	return `${value} recorrências`;
};

export function RecurringExpensesWidget({
	data,
}: RecurringExpensesWidgetProps) {
	if (data.expenses.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiRefreshLine className="size-6 text-muted-foreground" />}
				title="Nenhuma despesa recorrente"
				description="Lançamentos recorrentes aparecerão aqui conforme forem registrados."
			/>
		);
	}

	return (
		<div className="flex flex-col">
			{data.expenses.map((expense) => {
				return (
					<div
						key={expense.id}
						className="flex items-center gap-2 transition-all duration-300 py-1.5"
					>
						<EstablishmentLogo name={expense.name} size={37} />

						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between">
								<p className="truncate text-foreground text-sm font-medium">
									{expense.name}
								</p>

								<MoneyValues amount={expense.amount} />
							</div>

							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									{expense.paymentMethod}
								</span>
								<span>{formatOccurrences(expense.recurrenceCount)}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
