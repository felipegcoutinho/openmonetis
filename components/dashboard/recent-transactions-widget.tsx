import { RiExchangeLine } from "@remixicon/react";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/money-values";
import type { RecentTransactionsData } from "@/lib/dashboard/recent-transactions";
import { WidgetEmptyState } from "../widget-empty-state";

type RecentTransactionsWidgetProps = {
	data: RecentTransactionsData;
};

const formatTransactionDate = (date: Date | string) => {
	const d = date instanceof Date ? date : new Date(date);
	const formatter = new Intl.DateTimeFormat("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		timeZone: "UTC",
	});

	const formatted = formatter.format(d);
	// Capitaliza a primeira letra do dia da semana
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export function RecentTransactionsWidget({
	data,
}: RecentTransactionsWidgetProps) {
	return (
		<div className="flex flex-col px-0">
			{data.transactions.length === 0 ? (
				<WidgetEmptyState
					icon={<RiExchangeLine className="size-6 text-muted-foreground" />}
					title="Nenhum lançamento encontrado"
					description="Quando houver despesas registradas, elas aparecerão aqui."
				/>
			) : (
				<ul className="flex flex-col">
					{data.transactions.map((transaction) => {
						return (
							<li
								key={transaction.id}
								className="flex items-center justify-between gap-3 border-b border-dashed py-2 last:border-b-0 last:pb-0"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<EstabelecimentoLogo name={transaction.name} size={37} />

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{transaction.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatTransactionDate(transaction.purchaseDate)}
										</p>
									</div>
								</div>

								<div className="shrink-0 text-foreground">
									<MoneyValues amount={transaction.amount} />
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
