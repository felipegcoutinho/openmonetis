import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state para a página de orçamentos
 * Layout: MonthPicker + Header + Grid de cards de orçamento
 */
export default function OrcamentosLoading() {
	return (
		<main className="flex flex-col gap-6">
			{/* Month Picker placeholder */}
			<div className="h-[60px] animate-pulse rounded-2xl bg-foreground/10" />

			<div className="space-y-6 pt-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-8 w-48 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-5 w-64 rounded-2xl bg-foreground/10" />
					</div>
					<Skeleton className="h-10 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Grid de cards de orçamentos */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-2xl border p-6 space-y-4">
							{/* Categoria com ícone */}
							<div className="flex items-center gap-3">
								<Skeleton className="size-10 rounded-2xl bg-foreground/10" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-32 rounded-2xl bg-foreground/10" />
									<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
								</div>
							</div>

							{/* Valor orçado */}
							<div className="space-y-2 pt-4 border-t">
								<Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-7 w-32 rounded-2xl bg-foreground/10" />
							</div>

							{/* Valor gasto */}
							<div className="space-y-2">
								<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-6 w-28 rounded-2xl bg-foreground/10" />
							</div>

							{/* Barra de progresso */}
							<div className="space-y-2">
								<Skeleton className="h-2 w-full rounded-full bg-foreground/10" />
								<Skeleton className="h-3 w-16 rounded-2xl bg-foreground/10" />
							</div>

							{/* Botões de ação */}
							<div className="flex gap-2 pt-2">
								<Skeleton className="h-9 flex-1 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-9 w-9 rounded-2xl bg-foreground/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
