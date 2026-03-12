"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

type SortableWidgetProps = {
	id: string;
	children: ReactNode;
	isEditing: boolean;
};

export function SortableWidget({
	id,
	children,
	isEditing,
}: SortableWidgetProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, disabled: !isEditing });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative",
				isDragging && "z-50 opacity-90",
				isEditing &&
					"cursor-grab active:cursor-grabbing touch-none select-none",
			)}
			{...(isEditing ? { ...attributes, ...listeners } : {})}
		>
			{children}
		</div>
	);
}
