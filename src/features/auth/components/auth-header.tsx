import { cn } from "@/shared/utils/ui";

interface AuthHeaderProps {
	title: string;
	description?: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-2.5")}>
			<h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
				{title}
			</h1>
			{description ? (
				<p className="max-w-md text-sm leading-6 text-muted-foreground">
					{description}
				</p>
			) : null}
		</div>
	);
}
