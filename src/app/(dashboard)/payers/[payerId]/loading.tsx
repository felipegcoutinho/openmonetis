import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Loading state para a página de detalhes do pagador.
 * Layout: navegação mensal + tabs com card compartilhado do pagador.
 */
export default function PagadorDetailsLoading() {
	return (
		<main className="flex flex-col gap-6">
			<div className="h-[60px] animate-pulse rounded-md bg-foreground/10" />

			<div className="space-y-6 pt-4">
				<div className="flex gap-2 border-b">
					<Skeleton className="h-10 w-32 rounded-t-md bg-foreground/10" />
					<Skeleton className="h-10 w-32 rounded-t-md bg-foreground/10" />
					<Skeleton className="h-10 w-36 rounded-t-md bg-foreground/10" />
				</div>

				<div className="rounded-md border p-6 space-y-4">
					<div className="flex items-start gap-4">
						<Skeleton className="size-20 rounded-full bg-foreground/10" />

						<div className="flex-1 space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="h-7 w-48 rounded-md bg-foreground/10" />
								<Skeleton className="h-6 w-20 rounded-md bg-foreground/10" />
							</div>

							<Skeleton className="h-5 w-64 rounded-md bg-foreground/10" />

							<div className="flex items-center gap-2">
								<Skeleton className="size-2 rounded-full bg-foreground/10" />
								<Skeleton className="h-4 w-16 rounded-md bg-foreground/10" />
							</div>
						</div>

						<div className="flex gap-2">
							<Skeleton className="h-9 w-9 rounded-md bg-foreground/10" />
							<Skeleton className="h-9 w-9 rounded-md bg-foreground/10" />
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-md border p-6 space-y-4 lg:col-span-2">
						<Skeleton className="h-6 w-48 rounded-md bg-foreground/10" />
						<div className="grid grid-cols-3 gap-4 pt-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-4 w-20 rounded-md bg-foreground/10" />
									<Skeleton className="h-7 w-full rounded-md bg-foreground/10" />
								</div>
							))}
						</div>
					</div>

					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-md border p-6 space-y-4">
							<div className="flex items-center gap-2">
								<Skeleton className="size-5 rounded-md bg-foreground/10" />
								<Skeleton className="h-6 w-32 rounded-md bg-foreground/10" />
							</div>
							<div className="space-y-3 pt-4">
								<Skeleton className="h-5 w-full rounded-md bg-foreground/10" />
								<Skeleton className="h-5 w-3/4 rounded-md bg-foreground/10" />
								<Skeleton className="h-5 w-1/2 rounded-md bg-foreground/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
