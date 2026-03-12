import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Skeleton fiel ao WidgetCard
 * Usado enquanto widgets do dashboard estão carregando
 */
export function WidgetSkeleton() {
	return (
		<Card className="relative h-auto gap-0 py-0 md:h-custom-height-card md:overflow-hidden">
			<CardHeader className="border-b px-6 py-4">
				<div className="flex w-full items-start justify-between">
					<div className="min-w-0 space-y-1.5">
						{/* Title com ícone */}
						<div className="flex items-center gap-2">
							<Skeleton className="size-4 rounded-2xl bg-foreground/10" />
							<Skeleton className="h-5 w-32 rounded-2xl bg-foreground/10" />
						</div>
						{/* Subtitle */}
						<Skeleton className="h-3 w-48 rounded-2xl bg-foreground/10" />
					</div>
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 overflow-hidden px-6 py-4">
				<div className="flex flex-col gap-3">
					{/* Simula 5 linhas de conteúdo */}
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between gap-3">
							<div className="flex flex-1 items-center gap-3">
								<Skeleton className="size-10 rounded-2xl bg-foreground/10" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
									<Skeleton className="h-3 w-24 rounded-2xl bg-foreground/10" />
								</div>
							</div>
							<Skeleton className="h-6 w-20 rounded-2xl bg-foreground/10" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
