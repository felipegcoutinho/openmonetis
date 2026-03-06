import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para o card de resumo da conta (AccountStatementCard)
 * Reflete fielmente o layout: logo + nome + tipo + badge + métricas
 */
export function AccountStatementCardSkeleton() {
	return (
		<div className="rounded-2xl border p-6 space-y-6">
			{/* Header com logo, nome, tipo e badge */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					{/* Logo */}
					<Skeleton className="size-12 rounded-2xl bg-foreground/10" />

					<div className="space-y-2">
						{/* Nome da conta */}
						<Skeleton className="h-6 w-48 rounded-2xl bg-foreground/10" />
						{/* Tipo de conta */}
						<Skeleton className="h-4 w-32 rounded-2xl bg-foreground/10" />
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Badge de status */}
					<Skeleton className="h-6 w-16 rounded-2xl bg-foreground/10" />
					{/* Botão de editar */}
					<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
				</div>
			</div>

			{/* Métricas em grid */}
			<div className="grid grid-cols-2 gap-4 pt-4 border-t md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-6 w-32 rounded-2xl bg-foreground/10" />
					</div>
				))}
			</div>
		</div>
	);
}
