import { Skeleton } from "@/shared/components/ui/skeleton";

export function AccountStatementCardSkeleton() {
	return (
		<div className="rounded-xl border px-4 py-4 sm:px-5 sm:py-5">
			<div className="flex flex-col gap-4">
				{/* Linha 1 — identidade */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Skeleton className="size-12 shrink-0 rounded-full bg-foreground/10" />
						<div className="space-y-1.5">
							<Skeleton className="h-4 w-36 rounded bg-foreground/10" />
							<Skeleton className="h-3 w-28 rounded bg-foreground/10" />
						</div>
					</div>
					<Skeleton className="size-7 rounded bg-foreground/10" />
				</div>

				{/* Linha 2 — saldo hero */}
				<div className="space-y-2">
					<Skeleton className="h-3 w-40 rounded bg-foreground/10" />
					<Skeleton className="h-9 w-44 rounded bg-foreground/10" />
					<div className="flex gap-2">
						<Skeleton className="h-5 w-12 rounded-full bg-foreground/10" />
						<Skeleton className="h-5 w-20 rounded bg-foreground/10" />
					</div>
				</div>

				{/* Linha 3 — breakdown */}
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="rounded-md border border-border/60 px-3 py-2 space-y-1.5"
						>
							<Skeleton className="h-3 w-16 rounded bg-foreground/10" />
							<Skeleton className="h-5 w-24 rounded bg-foreground/10" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
