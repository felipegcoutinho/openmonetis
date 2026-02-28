import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriasLoading() {
	return (
		<main className="flex flex-col items-start gap-6">
			<div className="w-full space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-32 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-10 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Tabs */}
				<div className="space-y-4">
					<div className="flex gap-2 border-b">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton
								key={i}
								className="h-10 w-32 rounded-t-2xl bg-foreground/10"
							/>
						))}
					</div>

					{/* Tabela de categorias */}
					<Card className="py-2">
						<CardContent className="px-2 py-4 sm:px-4">
							<div className="space-y-0">
								{/* Header da tabela */}
								<div className="flex items-center gap-4 border-b px-2 pb-3">
									<Skeleton className="size-5 rounded bg-foreground/10" />
									<Skeleton className="h-4 w-16 rounded bg-foreground/10" />
									<div className="flex-1" />
									<Skeleton className="h-4 w-14 rounded bg-foreground/10" />
								</div>

								{/* Linhas da tabela */}
								{Array.from({ length: 8 }).map((_, i) => (
									<div
										key={i}
										className="flex items-center gap-4 border-b border-dashed px-2 py-3 last:border-b-0"
									>
										<Skeleton className="size-8 rounded-lg bg-foreground/10" />
										<Skeleton
											className="h-4 rounded bg-foreground/10"
											style={{ width: `${100 + (i % 4) * 30}px` }}
										/>
										<div className="flex-1" />
										<div className="flex items-center gap-3">
											<Skeleton className="h-4 w-14 rounded bg-foreground/10" />
											<Skeleton className="h-4 w-16 rounded bg-foreground/10" />
											<Skeleton className="h-4 w-16 rounded bg-foreground/10" />
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
