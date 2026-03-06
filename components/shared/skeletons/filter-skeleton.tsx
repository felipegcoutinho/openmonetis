import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para os filtros de lançamentos
 * Mantém o layout horizontal com múltiplos selects
 */
export function FilterSkeleton() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{Array.from({ length: 6 }).map((_, i) => (
				<Skeleton
					key={i}
					className="h-10 w-[130px] rounded-2xl bg-foreground/10"
				/>
			))}
			<Skeleton className="h-10 w-[150px] rounded-2xl bg-foreground/10" />
			<Skeleton className="h-8 w-16 rounded-2xl bg-foreground/10" />
		</div>
	);
}
