import { Skeleton } from "@/shared/components/ui/skeleton";

export default function AnexosLoading() {
	return (
		<main className="flex flex-col gap-6">
			<div className="w-full space-y-6">
				{/* Header */}
				<Skeleton className="h-10 w-40 rounded-md bg-foreground/10" />

				{/* Month navigation */}
				<Skeleton className="h-10 w-64 rounded-md bg-foreground/10" />

				{/* Count */}
				<Skeleton className="h-4 w-20 rounded-md bg-foreground/10" />

				{/* Grid */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{Array.from({ length: 10 }).map((_, i) => (
						<div
							key={i}
							className="flex flex-col overflow-hidden rounded-lg border"
						>
							<Skeleton className="aspect-square w-full bg-foreground/10" />
							<div className="space-y-1.5 p-2.5">
								<Skeleton className="h-3 w-3/4 rounded bg-foreground/10" />
								<Skeleton className="h-3 w-full rounded bg-foreground/10" />
								<div className="flex justify-between">
									<Skeleton className="h-3 w-16 rounded bg-foreground/10" />
									<Skeleton className="h-3 w-12 rounded bg-foreground/10" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
