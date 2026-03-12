import { cn } from "@/shared/utils/ui";

interface AuthHeaderProps {
	title: string;
}

export function AuthHeader({ title }: AuthHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-1.5")}>
			<h1 className="text-xl font-semibold tracking-tight text-card-foreground">
				{title}
			</h1>
		</div>
	);
}
