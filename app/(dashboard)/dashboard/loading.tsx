import { DashboardGridSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<main className="flex flex-col gap-4">
			<div className="space-y-2 px-1 py-2">
				<Skeleton className="h-8 w-72 rounded-xl bg-foreground/10" />
				<Skeleton className="h-5 w-56 rounded-xl bg-foreground/10" />
			</div>

			{/* Month Picker skeleton */}
			<Skeleton className="h-[56px] w-full rounded-xl bg-foreground/10" />

			{/* Dashboard content skeleton (Section Cards + Widget Grid) */}
			<DashboardGridSkeleton />
		</main>
	);
}
