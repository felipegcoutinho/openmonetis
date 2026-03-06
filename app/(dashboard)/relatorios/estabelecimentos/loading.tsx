import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-8 w-48" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<Skeleton className="h-16 w-full" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-5 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</CardContent>
					</Card>
				</div>
				<div>
					<Card>
						<CardHeader>
							<Skeleton className="h-5 w-40" />
						</CardHeader>
						<CardContent className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
