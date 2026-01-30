import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="flex flex-col gap-4">
			{/* MonthNavigation skeleton */}
			<Skeleton className="h-10 w-64" />

			{/* Summary stats */}
			<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<Skeleton className="h-3 w-16 mb-1" />
							<Skeleton className="h-6 w-24" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Cards grid */}
			<div className="grid gap-2 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-16 w-full rounded-lg" />
				))}
			</div>

			{/* CardUsageChart */}
			<Card>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 w-32" />
						<div className="flex items-center gap-2">
							<Skeleton className="size-6 rounded" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[280px] w-full" />
				</CardContent>
			</Card>

			{/* CategoryBreakdown + TopExpenses */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card className="h-full">
					<CardHeader className="pb-3">
						<Skeleton className="h-5 w-36" />
					</CardHeader>
					<CardContent className="space-y-2">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-14 w-full" />
						))}
					</CardContent>
				</Card>

				<Card className="h-full">
					<CardHeader className="pb-3">
						<Skeleton className="h-5 w-36" />
					</CardHeader>
					<CardContent className="space-y-2">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-14 w-full" />
						))}
					</CardContent>
				</Card>
			</div>

			{/* CardInvoiceStatus - timeline minimalista */}
			<Card>
				<CardHeader className="pb-2">
					<Skeleton className="h-5 w-24" />
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className="flex-1 flex flex-col items-center gap-1">
								<Skeleton className="w-full h-3 rounded-sm" />
								<Skeleton className="h-3 w-6" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
