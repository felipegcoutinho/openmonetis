import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Loading state para a página de pagadores
 * Layout: Header + Input de compartilhamento + Grid de cards
 */
export default function PagadoresLoading() {
	return (
		<main className="flex flex-col items-start gap-6">
			<div className="w-full space-y-6">
				{/* Input de código de compartilhamento */}
				<div className="rounded-md border p-4 space-y-3">
					<Skeleton className="h-5 w-64 rounded-md bg-foreground/10" />
					<div className="flex gap-2">
						<Skeleton className="h-10 flex-1 rounded-md bg-foreground/10" />
						<Skeleton className="h-10 w-32 rounded-md bg-foreground/10" />
					</div>
				</div>

				{/* Grid de cards de pagadores */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-md border p-6 space-y-4">
							{/* Avatar + Nome + Badge */}
							<div className="flex items-start gap-4">
								<Skeleton className="size-16 rounded-full bg-foreground/10" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-6 w-32 rounded-md bg-foreground/10" />
									<Skeleton className="h-5 w-20 rounded-md bg-foreground/10" />
								</div>
								{i === 0 && (
									<Skeleton className="h-6 w-16 rounded-md bg-foreground/10" />
								)}
							</div>

							{/* Email */}
							<Skeleton className="h-4 w-full rounded-md bg-foreground/10" />

							{/* Status */}
							<div className="flex items-center gap-2">
								<Skeleton className="size-2 rounded-full bg-foreground/10" />
								<Skeleton className="h-4 w-16 rounded-md bg-foreground/10" />
							</div>

							{/* Botões de ação */}
							<div className="flex gap-2 pt-2 border-t">
								<Skeleton className="h-9 flex-1 rounded-md bg-foreground/10" />
								<Skeleton className="h-9 w-9 rounded-md bg-foreground/10" />
								<Skeleton className="h-9 w-9 rounded-md bg-foreground/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
