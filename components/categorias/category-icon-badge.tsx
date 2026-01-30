"use client";

import {
	buildCategoryInitials,
	getCategoryBgColor,
	getCategoryColor,
} from "@/lib/utils/category-colors";
import { getIconComponent } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/ui";

const sizeVariants = {
	sm: {
		container: "size-8",
		icon: "size-4",
		text: "text-[10px]",
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
	/** Nome da categoria (usado para gerar iniciais como fallback) */
	name: string;
	/** Índice para determinar a cor (cicla entre as cores disponíveis) */
	colorIndex: number;
	/** Tamanho do badge: sm (32px), md (36px), lg (48px) */
	size?: CategoryIconBadgeSize;
	/** Classes adicionais para o container */
	className?: string;
}

export function CategoryIconBadge({
	icon,
	name,
	colorIndex,
	size = "md",
	className,
}: CategoryIconBadgeProps) {
	const IconComponent = icon ? getIconComponent(icon) : null;
	const initials = buildCategoryInitials(name);
	const color = getCategoryColor(colorIndex);
	const bgColor = getCategoryBgColor(colorIndex);
	const variant = sizeVariants[size];

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
				variant.container,
				className,
			)}
			style={{ backgroundColor: bgColor }}
		>
			{IconComponent ? (
				<IconComponent className={variant.icon} style={{ color }} />
			) : (
				<span
					className={cn("font-semibold uppercase", variant.text)}
					style={{ color }}
				>
					{initials}
				</span>
			)}
		</div>
	);
}
