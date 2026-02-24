import {
	AccountStatementCardSkeleton,
	FilterSkeleton,
	TransactionsTableSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state para a página de extrato de conta
 * Layout: MonthPicker + AccountStatementCard + Filtros + Tabela de lançamentos
 */
export default function ExtratoLoading() {
	return (
		<main className="flex flex-col gap-6">
			{/* Month Picker placeholder */}
			<div className="h-[60px] animate-pulse rounded-2xl bg-foreground/10" />

			{/* Account Statement Card */}
			<AccountStatementCardSkeleton />

			{/* Seção de lançamentos */}
			<section className="flex flex-col gap-4">
				<div className="space-y-6 pt-4">
					{/* Header */}
					<div className="flex items-center justify-between">
						<Skeleton className="h-8 w-48 rounded-2xl bg-foreground/10" />
					</div>

					{/* Filtros */}
					<FilterSkeleton />

					{/* Tabela */}
					<TransactionsTableSkeleton />
				</div>
			</section>
		</main>
	);
}
