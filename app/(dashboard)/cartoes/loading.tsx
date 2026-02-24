import { Skeleton } from "@/components/ui/skeleton";

export default function CartoesLoading() {
	return (
		<main className="flex flex-col gap-6">
			<div className="space-y-6 pt-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-32 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-10 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Grid de cartões */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-2xl border p-6 space-y-4">
							<div className="flex items-center justify-between">
								<Skeleton className="size-10 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-8 w-16 rounded-2xl bg-foreground/10" />
							</div>
							<Skeleton className="h-6 w-32 rounded-2xl bg-foreground/10" />
							<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
							<Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
