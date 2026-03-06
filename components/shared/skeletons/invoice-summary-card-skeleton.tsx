import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para o card de resumo da fatura (InvoiceSummaryCard)
 * Reflete fielmente o layout: logo + nome + bandeira + badges + total + limite + ações
 */
export function InvoiceSummaryCardSkeleton() {
	return (
		<div className="rounded-2xl border p-6 space-y-6">
			{/* Header com logo, nome, bandeira e badges */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					{/* Logo do cartão */}
					<Skeleton className="size-12 rounded-2xl bg-foreground/10" />

					<div className="space-y-2">
						{/* Nome do cartão */}
						<Skeleton className="h-6 w-48 rounded-2xl bg-foreground/10" />

						<div className="flex items-center gap-2">
							{/* Bandeira */}
							<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
							{/* Badge de status */}
							<Skeleton className="h-6 w-16 rounded-2xl bg-foreground/10" />
						</div>
					</div>
				</div>

				{/* Botão de editar */}
				<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
			</div>

			{/* Informações da fatura */}
			<div className="space-y-4 pt-4 border-t">
				{/* Período e status */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-6 w-24 rounded-2xl bg-foreground/10" />
				</div>

				{/* Total da fatura */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-28 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-8 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Limite e utilização */}
				<div className="grid grid-cols-2 gap-4 pt-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-6 w-28 rounded-2xl bg-foreground/10" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-6 w-28 rounded-2xl bg-foreground/10" />
					</div>
				</div>

				{/* Botão de ação */}
				<Skeleton className="h-10 w-full rounded-2xl bg-foreground/10" />
			</div>
		</div>
	);
}
