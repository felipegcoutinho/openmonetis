import {
	FilterSkeleton,
	TransactionsTableSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state para a página de lançamentos
 * Mantém o mesmo layout da página final
 */
export default function LancamentosLoading() {
	return (
		<main className="flex flex-col gap-6">
			{/* Month Picker placeholder */}
			<div className="h-[60px] animate-pulse rounded-2xl bg-foreground/10" />

			<div className="space-y-6 pt-4">
				{/* Header com título e botão */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-10 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Filtros */}
				<FilterSkeleton />

				{/* Tabela */}
				<TransactionsTableSkeleton />
			</div>
		</main>
	);
}
