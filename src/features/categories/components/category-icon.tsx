"use client";

import type { RemixiconComponentType } from "@remixicon/react";
import * as RemixIcons from "@remixicon/react";
import { cn } from "@/shared/utils/ui";

const ICONS = RemixIcons as Record<string, RemixiconComponentType | undefined>;
const FALLBACK_ICON = ICONS.RiPriceTag3Line;

interface CategoryIconProps {
	name?: string | null;
	className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
	const IconComponent =
		(name ? ICONS[name] : undefined) ?? FALLBACK_ICON ?? null;

	if (!IconComponent) {
		return (
			<span className={cn("text-xs text-muted-foreground", className)}>
				{name ?? "Categoria"}
			</span>
		);
	}

	return <IconComponent className={cn("size-5", className)} aria-hidden />;
}
