import { SectionCardsSkeleton } from "./section-cards-skeleton";
import { WidgetSkeleton } from "./widget-skeleton";

/**
 * Skeleton completo para o dashboard grid
 * Mantém a mesma estrutura de layout do dashboard real
 */
export function DashboardGridSkeleton() {
	return (
		<div className="@container/main space-y-4">
			{/* Section Cards no topo */}
			<SectionCardsSkeleton />

			{/* Grid de widgets - mesmos breakpoints do dashboard real */}
			<div className="grid grid-cols-1 gap-3 @4xl/main:grid-cols-2 @6xl/main:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					<WidgetSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
