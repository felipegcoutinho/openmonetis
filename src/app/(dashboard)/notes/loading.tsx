import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Loading state para a página de anotações
 * Layout: Header com botão + Grid de cards de notas
 */
export default function AnotacoesLoading() {
	return (
		<main className="flex flex-col items-start gap-6">
			<div className="w-full space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-32 rounded-2xl bg-foreground/10" />
					<Skeleton className="h-10 w-40 rounded-2xl bg-foreground/10" />
				</div>

				{/* Grid de cards de notas */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-2xl border p-4 space-y-3">
							{/* Título */}
							<Skeleton className="h-6 w-3/4 rounded-2xl bg-foreground/10" />

							{/* Conteúdo (3-4 linhas) */}
							<div className="space-y-2">
								<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
								<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
								<Skeleton className="h-4 w-2/3 rounded-2xl bg-foreground/10" />
								{i % 2 === 0 && (
									<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
								)}
							</div>

							{/* Footer com data e ações */}
							<div className="flex items-center justify-between pt-2 border-t">
								<Skeleton className="h-3 w-24 rounded-2xl bg-foreground/10" />
								<div className="flex gap-1">
									<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
									<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
