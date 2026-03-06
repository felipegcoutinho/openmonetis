import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton fiel aos cards de métricas do dashboard (SectionCards)
 * Mantém o mesmo layout de 4 colunas responsivo
 */
export function SectionCardsSkeleton() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{Array.from({ length: 4 }).map((_, index) => (
				<Card key={index} className="@container/card gap-2">
					<CardHeader>
						<div className="space-y-3">
							{/* Título com ícone */}
							<div className="flex items-center gap-1">
								<Skeleton className="size-4 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-5 w-20 rounded-2xl bg-foreground/10" />
							</div>

							{/* Valor principal */}
							<Skeleton className="h-8 w-32 rounded-2xl bg-foreground/10" />

							{/* Badge de tendência */}
							<Skeleton className="h-6 w-16 rounded-2xl bg-foreground/10" />
						</div>
					</CardHeader>

					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
