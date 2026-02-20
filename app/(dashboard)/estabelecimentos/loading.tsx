import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex justify-start">
				<Skeleton className="h-10 w-[200px]" />
			</div>
			<div className="rounded-md border">
				<div className="flex flex-col gap-3 p-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>
		</div>
	);
}
