import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Loading state para a página de calendário
 * Layout: MonthPicker + Grade mensal 7x5/6 com dias e eventos
 */
export default function CalendarioLoading() {
	return (
		<main className="flex flex-col gap-3">
			{/* Month Picker placeholder */}
			<div className="h-[60px] animate-pulse rounded-2xl bg-foreground/10" />

			{/* Calendar Container */}
			<div className="rounded-2xl border p-4 space-y-4">
				{/* Cabeçalho com dias da semana */}
				<div className="grid grid-cols-7 gap-2 mb-4">
					{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
						<div key={day} className="text-center">
							<Skeleton className="h-4 w-12 mx-auto rounded-2xl bg-foreground/10" />
						</div>
					))}
				</div>

				{/* Grade de dias (6 semanas) */}
				<div className="grid grid-cols-7 gap-2">
					{Array.from({ length: 42 }).map((_, i) => (
						<div
							key={i}
							className="min-h-[100px] rounded-2xl border p-2 space-y-2"
						>
							{/* Número do dia */}
							<Skeleton className="h-5 w-6 rounded-2xl bg-foreground/10" />

							{/* Indicadores de eventos (aleatório entre 0-3) */}
							{i % 3 === 0 && (
								<div className="space-y-1">
									<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
									{i % 5 === 0 && (
										<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
									)}
								</div>
							)}
						</div>
					))}
				</div>

				{/* Legenda */}
				<div className="flex flex-wrap items-center gap-4 pt-4 border-t">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center gap-2">
							<Skeleton className="size-3 rounded-full bg-foreground/10" />
							<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
