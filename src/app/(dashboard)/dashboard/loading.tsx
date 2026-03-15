import {
	DashboardGridSkeleton,
	DashboardMetricsCardsSkeleton,
} from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<main className="flex flex-col gap-4">
			<div className="space-y-2 p-2">
				<Skeleton className="h-7 w-56 rounded-md bg-foreground/10" />
				<Skeleton className="h-4 w-48 rounded-md bg-foreground/10" />
			</div>

			<div className="h-[60px] rounded-md border bg-card/60 p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Skeleton className="size-8 rounded-md bg-foreground/10" />
						<Skeleton className="h-5 w-36 rounded-md bg-foreground/10" />
						<Skeleton className="size-8 rounded-md bg-foreground/10" />
					</div>
					<Skeleton className="hidden h-8 w-24 rounded-md bg-foreground/10 sm:block" />
				</div>
			</div>

			<DashboardMetricsCardsSkeleton />
			<DashboardGridSkeleton />
		</main>
	);
}
