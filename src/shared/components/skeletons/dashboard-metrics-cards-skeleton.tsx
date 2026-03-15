import {
	Card,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function DashboardMetricsCardsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{Array.from({ length: 4 }).map((_, index) => (
				<Card
					key={index}
					className="@container/card flex flex-col justify-between min-h-32"
				>
					<CardHeader>
						<CardTitle className="flex items-center gap-1">
							<Skeleton className="size-4 rounded-md bg-foreground/10" />
							<Skeleton className="h-4 w-20 rounded-md bg-foreground/10" />
						</CardTitle>
						<div className="flex items-baseline gap-2 mt-auto pt-4">
							<Skeleton className="h-9 w-32 rounded-md bg-foreground/10" />
							<Skeleton className="h-4 w-12 rounded-md bg-foreground/10" />
						</div>
					</CardHeader>

					<CardFooter className="text-sm">
						<div className="flex items-center gap-1.5">
							<Skeleton className="h-3 w-20 rounded-md bg-foreground/10" />
							<Skeleton className="h-3 w-16 rounded-md bg-foreground/10" />
						</div>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
