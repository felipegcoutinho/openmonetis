import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Skeleton para o card de resumo da fatura (InvoiceSummaryCard)
 * Reflete fielmente o layout: logo + nome + bandeira + badges + total + limite + ações
 */
export function InvoiceSummaryCardSkeleton() {
	return (
		<div className="rounded-md border p-4 space-y-4 sm:p-5">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton className="size-12 rounded-full bg-foreground/10" />
					<div className="min-w-0 space-y-2">
						<Skeleton className="h-4 w-40 rounded-md bg-foreground/10" />
						<Skeleton className="h-3 w-28 rounded-md bg-foreground/10" />
					</div>
				</div>
				<Skeleton className="size-8 rounded-md bg-foreground/10" />
			</div>

			<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-3 w-24 rounded-md bg-foreground/10" />
					<Skeleton className="h-9 w-44 rounded-md bg-foreground/10" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-20 rounded-md bg-foreground/10" />
						<Skeleton className="h-4 w-28 rounded-md bg-foreground/10" />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Skeleton className="h-14 w-full rounded-md bg-foreground/10" />
					<Skeleton className="h-14 w-full rounded-md bg-foreground/10" />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-14 w-full rounded-md bg-foreground/10"
					/>
				))}
			</div>

			<div className="rounded-md border border-dashed p-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-2">
						<Skeleton className="h-4 w-24 rounded-md bg-foreground/10" />
						<Skeleton className="h-3 w-40 rounded-md bg-foreground/10" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-9 w-32 rounded-md bg-foreground/10" />
						<Skeleton className="size-8 rounded-md bg-foreground/10" />
					</div>
				</div>
			</div>
		</div>
	);
}
