"use client";

import type { ComponentType } from "react";
import {
	buildInitials,
	getCategoryBgColorFromName,
	getCategoryColorFromName,
} from "@/shared/utils/category-colors";
import { getIconComponent } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";

const sizeVariants = {
	sm: {
		container: "size-8",
		icon: "size-4",
		text: "text-xs",
	},
	md: {
		container: "size-9",
		icon: "size-5",
		text: "text-xs",
	},
	lg: {
		container: "size-12",
		icon: "size-6",
		text: "text-sm",
	},
} as const;

export type CategoryIconBadgeSize = keyof typeof sizeVariants;

export interface CategoryIconBadgeProps {
	/** Nome do ícone Remix (ex: "RiShoppingBag3Line") */
	icon?: string | null;
	/** Nome da categoria — define cor e iniciais de fallback */
	name: string;
	/** Tamanho do badge: sm (32px), md (36px), lg (48px) */
	size?: CategoryIconBadgeSize;
	/** Classes adicionais para o container */
	className?: string;
}

export function CategoryIconBadge({
	icon,
	name,
	size = "md",
	className,
}: CategoryIconBadgeProps) {
	const IconComponent = icon
		? (getIconComponent(icon) as ComponentType<{
				className?: string;
				style?: React.CSSProperties;
			}>)
		: null;
	const initials = buildInitials(name);
	const color = getCategoryColorFromName(name);
	const bgColor = getCategoryBgColorFromName(name);
	const variant = sizeVariants[size];

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full",
				variant.container,
				className,
			)}
			style={{ backgroundColor: bgColor }}
		>
			{IconComponent ? (
				<IconComponent className={variant.icon} style={{ color }} />
			) : (
				<span className={cn("uppercase", variant.text)} style={{ color }}>
					{initials}
				</span>
			)}
		</div>
	);
}
