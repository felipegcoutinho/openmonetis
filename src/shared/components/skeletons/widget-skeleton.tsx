import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const LINE_WIDTHS = ["w-full", "w-5/6", "w-4/5", "w-full", "w-3/4"] as const;
const SUBLABEL_WIDTHS = ["w-24", "w-16", "w-20", "w-28", "w-16"] as const;

export function WidgetSkeleton() {
	return (
		<Card className="relative h-auto gap-0 py-0 md:h-custom-height-card md:overflow-hidden">
			<CardHeader className="border-b px-6 py-4">
				<div className="flex w-full items-start justify-between">
					<div className="min-w-0 space-y-1.5">
						<div className="flex items-center gap-2">
							<Skeleton className="size-4 rounded-md bg-foreground/10" />
							<Skeleton className="h-5 w-32 rounded-md bg-foreground/10" />
						</div>
						<Skeleton className="h-3 w-48 rounded-md bg-foreground/10" />
					</div>
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 overflow-hidden px-6 py-4">
				<div className="flex flex-col gap-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between gap-3">
							<div className="flex flex-1 items-center gap-3">
								<Skeleton className="size-10 rounded-md bg-foreground/10" />
								<div className="flex-1 space-y-2">
									<Skeleton
										className={`h-4 ${LINE_WIDTHS[i % LINE_WIDTHS.length]} rounded-md bg-foreground/10`}
									/>
									<Skeleton
										className={`h-3 ${SUBLABEL_WIDTHS[i % SUBLABEL_WIDTHS.length]} rounded-md bg-foreground/10`}
									/>
								</div>
							</div>
							<Skeleton className="h-6 w-20 rounded-md bg-foreground/10" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
