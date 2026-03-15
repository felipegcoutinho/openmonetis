import Image from "next/image";
import type { InstallmentExpense } from "@/features/dashboard/expenses/installment-expenses-queries";
import { buildInstallmentExpenseDisplay } from "@/features/dashboard/installment-expenses-helpers";
import MoneyValues from "@/shared/components/money-values";
import { Progress } from "@/shared/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";

type InstallmentExpenseListItemProps = {
	expense: InstallmentExpense;
};

export function InstallmentExpenseListItem({
	expense,
}: InstallmentExpenseListItemProps) {
	const {
		compactLabel,
		isLast,
		remainingInstallments,
		remainingAmount,
		endDate,
		progress,
	} = buildInstallmentExpenseDisplay(expense);

	return (
		<div className="flex items-center gap-3 transition-all duration-300 py-2">
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<p className="truncate text-sm font-medium text-foreground">
							{expense.name}
						</p>
						{compactLabel ? (
							<span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
								{compactLabel}
								{isLast ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex">
												<Image
													src="/icons/party.svg"
													alt="Última parcela"
													width={14}
													height={14}
													className="h-3.5 w-3.5"
												/>
												<span className="sr-only">Última parcela</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">Última parcela!</TooltipContent>
									</Tooltip>
								) : null}
							</span>
						) : null}
					</div>
					<MoneyValues amount={expense.amount} className="shrink-0" />
				</div>

				<p className="text-xs text-muted-foreground">
					{endDate ? `Termina em ${endDate}` : null}
					{" | Restante  "}
					<MoneyValues
						amount={remainingAmount}
						className="inline-block font-medium"
					/>{" "}
					({remainingInstallments})
				</p>

				<Progress value={progress} className="mt-1 h-2" />
			</div>
		</div>
	);
}
