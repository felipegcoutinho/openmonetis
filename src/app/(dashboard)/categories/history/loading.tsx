import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="flex flex-col gap-6 px-6">
			<Card className="h-auto">
				<CardContent className="space-y-2.5">
					<div className="space-y-2">
						{/* Selected categories and counter */}
						<div className="flex items-start justify-between gap-4">
							<div className="flex flex-wrap gap-2">
								<Skeleton className="h-8 w-32 rounded-md" />
								<Skeleton className="h-8 w-40 rounded-md" />
								<Skeleton className="h-8 w-36 rounded-md" />
							</div>
							<div className="flex items-center gap-2 shrink-0 pt-1.5">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-14" />
							</div>
						</div>

						{/* Category selector button */}
						<Skeleton className="h-9 w-full rounded-md" />
					</div>

					{/* Chart */}
					<Skeleton className="h-[450px] w-full rounded-lg" />
				</CardContent>
			</Card>
		</main>
	);
}
