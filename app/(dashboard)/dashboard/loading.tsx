import { DashboardGridSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<main className="flex flex-col gap-4">
			{/* Welcome Banner skeleton */}
			<Skeleton className="h-[104px] w-full rounded-xl bg-foreground/10" />

			{/* Month Picker skeleton */}
			<Skeleton className="h-[56px] w-full rounded-xl bg-foreground/10" />

			{/* Dashboard content skeleton (Section Cards + Widget Grid) */}
			<DashboardGridSkeleton />
		</main>
	);
}
