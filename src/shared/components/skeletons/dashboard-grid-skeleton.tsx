import { Skeleton } from "@/shared/components/ui/skeleton";
import { WidgetSkeleton } from "./widget-skeleton";

export function DashboardGridSkeleton() {
	return (
		<div className="@container/main space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:items-center sm:gap-2">
					<Skeleton className="h-12 rounded-md bg-foreground/10 sm:h-8 sm:w-28" />
					<Skeleton className="h-12 rounded-md bg-foreground/10 sm:h-8 sm:w-30" />
					<Skeleton className="h-12 rounded-md bg-foreground/10 sm:h-8 sm:w-28" />
				</div>
				<div className="flex w-full gap-2 sm:w-auto">
					<Skeleton className="h-10 flex-1 rounded-md bg-foreground/10 sm:h-8 sm:w-34 sm:flex-none" />
					<Skeleton className="h-10 flex-1 rounded-md bg-foreground/10 sm:h-8 sm:w-24 sm:flex-none" />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3 @4xl/main:grid-cols-2 @6xl/main:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					<WidgetSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
