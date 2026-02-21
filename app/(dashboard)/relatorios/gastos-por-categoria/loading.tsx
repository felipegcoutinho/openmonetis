import { Skeleton } from "@/components/ui/skeleton";

export default function GastosPorCategoriaLoading() {
	return (
		<main className="flex flex-col gap-6">
			<div className="h-14 animate-pulse rounded-xl bg-foreground/10" />

			<div className="rounded-xl border p-4 md:p-6 space-y-4">
				<div className="flex gap-2">
					<Skeleton className="h-9 w-20 rounded-lg" />
					<Skeleton className="h-9 w-20 rounded-lg" />
				</div>
				<div className="space-y-3 pt-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between py-2 border-b border-dashed">
							<div className="flex items-center gap-2">
								<Skeleton className="size-10 rounded-lg" />
								<div className="space-y-1">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
							<Skeleton className="h-5 w-20" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
