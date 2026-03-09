import { RiStore2Line } from "@remixicon/react";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/shared/money-values";
import type { TopEstablishmentsData } from "@/lib/dashboard/top-establishments";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";

type TopEstablishmentsWidgetProps = {
	data: TopEstablishmentsData;
};

const formatOccurrencesLabel = (occurrences: number) => {
	if (occurrences === 1) {
		return "1 lançamento";
	}
	return `${occurrences} lançamentos`;
};

export function TopEstablishmentsWidget({
	data,
}: TopEstablishmentsWidgetProps) {
	return (
		<div className="flex flex-col px-0">
			{data.establishments.length === 0 ? (
				<WidgetEmptyState
					icon={<RiStore2Line className="size-6 text-muted-foreground" />}
					title="Nenhum estabelecimento encontrado"
					description="Quando houver despesas registradas, elas aparecerão aqui."
				/>
			) : (
				<ul className="flex flex-col">
					{data.establishments.map((establishment) => {
						return (
							<li
								key={establishment.id}
								className="flex items-center justify-between gap-3 border-b border-dashed py-2 last:border-b-0 last:pb-0"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<EstabelecimentoLogo name={establishment.name} size={37} />

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{establishment.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatOccurrencesLabel(establishment.occurrences)}
										</p>
									</div>
								</div>

								<div className="shrink-0 text-foreground">
									<MoneyValues amount={establishment.amount} />
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
