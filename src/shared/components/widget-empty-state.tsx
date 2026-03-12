import type { ReactNode } from "react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/shared/components/ui/empty";

type WidgetEmptyStateProps = {
	icon?: ReactNode;
	title: string;
	description?: string;
};

export function WidgetEmptyState({
	icon,
	title,
	description,
}: WidgetEmptyStateProps) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia>{icon}</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
