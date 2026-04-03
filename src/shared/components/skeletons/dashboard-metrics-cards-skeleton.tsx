import { RiInformationLine } from "@remixicon/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function DashboardMetricsCardsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{Array.from({ length: 4 }).map((_, index) => (
				<Card key={index} className="gap-2 overflow-hidden">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div className="w-full">
								<CardTitle className="flex items-center gap-1.5 tracking-tight">
									<Skeleton className="size-4 rounded-sm bg-foreground/10" />
									<Skeleton className="h-4 w-24 rounded-md bg-foreground/10" />
									<RiInformationLine
										className="size-4 text-muted-foreground/40"
										aria-hidden
									/>
								</CardTitle>
								<CardDescription className="mt-1.5 tracking-tight">
									<Skeleton className="h-3 w-32 rounded-md bg-foreground/10" />
								</CardDescription>
							</div>
						</div>
						<Separator className="mt-1" />
					</CardHeader>

					<CardContent className="flex flex-col gap-3">
						<div className="mt-1 flex flex-wrap items-center justify-between gap-2">
							<Skeleton className="h-10 w-36 rounded-md bg-foreground/10" />
							<Skeleton className="h-7 w-20 rounded-full bg-foreground/10" />
						</div>
						<div className="flex flex-col gap-1.5">
							<Skeleton className="h-4 w-28 rounded-md bg-foreground/10" />
							<Skeleton className="h-3 w-24 rounded-md bg-foreground/10" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
