import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton fiel ao WidgetCard
 * Usado enquanto widgets do dashboard estão carregando
 */
export function WidgetSkeleton() {
	return (
		<Card className="relative h-auto md:h-custom-height-1 md:overflow-hidden">
			<CardHeader className="border-b [.border-b]:pb-2">
				<div className="flex w-full items-start justify-between">
					<div className="space-y-2">
						{/* Title com ícone */}
						<div className="flex items-center gap-1">
							<Skeleton className="size-4 rounded-2xl bg-foreground/10" />
							<Skeleton className="h-5 w-32 rounded-2xl bg-foreground/10" />
						</div>
						{/* Subtitle */}
						<Skeleton className="h-4 w-48 rounded-2xl bg-foreground/10" />
					</div>
				</div>
			</CardHeader>

			<CardContent className="max-h-[calc(var(--spacing-custom-height-1)-5rem)] overflow-hidden md:max-h-[calc(100%-5rem)]">
				<div className="flex flex-col gap-3 py-4">
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
