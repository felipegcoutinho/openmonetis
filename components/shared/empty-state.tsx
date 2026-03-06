import type { ReactNode } from "react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils/ui";

interface EmptyStateProps {
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	media?: ReactNode;
	mediaVariant?: "default" | "icon";
	className?: string;
	contentClassName?: string;
	children?: ReactNode;
}

export function EmptyState({
	title,
	description,
	media,
	mediaVariant = "default",
	className,
	contentClassName,
	children,
}: EmptyStateProps) {
	const hasContent = Boolean(children);

	return (
		<Empty className={cn("w-full max-w-xl min-h-[320px]", className)}>
			<EmptyHeader>
				{media ? (
					<EmptyMedia variant={mediaVariant} className="mb-0">
						{media}
					</EmptyMedia>
				) : null}
				<EmptyTitle>{title}</EmptyTitle>
				{description ? (
					<EmptyDescription>{description}</EmptyDescription>
				) : null}
			</EmptyHeader>

			{hasContent ? (
				<EmptyContent className={cn(contentClassName)}>{children}</EmptyContent>
			) : null}
		</Empty>
	);
}
