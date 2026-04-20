import { RiStore2Line } from "@remixicon/react";
import type { TopEstablishmentsData } from "@/features/dashboard/top-establishments-queries";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";

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
				<div className="flex flex-col">
					{data.establishments.map((establishment) => {
						return (
							<div
								key={establishment.id}
								className="flex items-center justify-between gap-3 transition-all duration-300 py-2"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<EstablishmentLogo name={establishment.name} size={37} />

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
									<MoneyValues
										className="font-medium"
										amount={establishment.amount}
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
