import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state para a página de insights com IA
 */
export default function InsightsLoading() {
	return (
		<main className="flex flex-col gap-6">
			<div className="space-y-6 pt-4">
				{/* Header */}
				<div className="space-y-2">
					<Skeleton className="h-10 w-64 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-6 w-96 rounded-2xl bg-foreground/10" />
				</div>

				{/* Grid de insights */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-2xl border p-6 space-y-4">
							<div className="flex items-start justify-between">
								<div className="space-y-2 flex-1">
									<Skeleton className="h-6 w-48 rounded-2xl bg-foreground/10" />
									<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
									<Skeleton className="h-4 w-3/4 rounded-2xl bg-foreground/10" />
								</div>
								<Skeleton className="size-8 rounded-full bg-foreground/10" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-3 w-full rounded-2xl bg-foreground/10" />
								<Skeleton className="h-3 w-full rounded-2xl bg-foreground/10" />
								<Skeleton className="h-3 w-2/3 rounded-2xl bg-foreground/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
