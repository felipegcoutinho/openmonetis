import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state para a página de detalhes do pagador
 * Layout: MonthPicker + Info do pagador + Tabs (Visão Geral / Lançamentos)
 */
export default function PagadorDetailsLoading() {
	return (
		<main className="flex flex-col gap-6">
			{/* Month Picker placeholder */}
			<div className="h-[60px] animate-pulse rounded-2xl bg-foreground/10" />

			{/* Info do Pagador (sempre visível) */}
			<div className="rounded-2xl border p-6 space-y-4">
				<div className="flex items-start gap-4">
					{/* Avatar */}
					<Skeleton className="size-20 rounded-full bg-foreground/10" />

					<div className="flex-1 space-y-3">
						{/* Nome + Badge */}
						<div className="flex items-center gap-3">
							<Skeleton className="h-7 w-48 rounded-2xl bg-foreground/10" />
							<Skeleton className="h-6 w-20 rounded-2xl bg-foreground/10" />
						</div>

						{/* Email */}
						<Skeleton className="h-5 w-64 rounded-2xl bg-foreground/10" />

						{/* Status */}
						<div className="flex items-center gap-2">
							<Skeleton className="size-2 rounded-full bg-foreground/10" />
							<Skeleton className="h-4 w-16 rounded-2xl bg-foreground/10" />
						</div>
					</div>

					{/* Botões de ação */}
					<div className="flex gap-2">
						<Skeleton className="h-9 w-9 rounded-2xl bg-foreground/10" />
						<Skeleton className="h-9 w-9 rounded-2xl bg-foreground/10" />
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="space-y-6 pt-4">
				<div className="flex gap-2 border-b">
					<Skeleton className="h-10 w-32 rounded-t-2xl bg-foreground/10" />
					<Skeleton className="h-10 w-32 rounded-t-2xl bg-foreground/10" />
				</div>

				{/* Conteúdo da aba Visão Geral (grid de cards) */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{/* Card de resumo mensal */}
					<div className="rounded-2xl border p-6 space-y-4 lg:col-span-2">
						<Skeleton className="h-6 w-48 rounded-2xl bg-foreground/10" />
						<div className="grid grid-cols-3 gap-4 pt-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
									<Skeleton className="h-7 w-full rounded-2xl bg-foreground/10" />
								</div>
							))}
						</div>
					</div>

					{/* Outros cards */}
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-2xl border p-6 space-y-4">
							<div className="flex items-center gap-2">
								<Skeleton className="size-5 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-6 w-32 rounded-2xl bg-foreground/10" />
							</div>
							<div className="space-y-3 pt-4">
								<Skeleton className="h-5 w-full rounded-2xl bg-foreground/10" />
								<Skeleton className="h-5 w-3/4 rounded-2xl bg-foreground/10" />
								<Skeleton className="h-5 w-1/2 rounded-2xl bg-foreground/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
