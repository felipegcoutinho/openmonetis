"use client";

import {
	RiDeleteBin5Line,
	RiFileList2Line,
	RiPencilLine,
} from "@remixicon/react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils/ui";
import { CategoryIconBadge } from "./category-icon-badge";
import type { Category } from "./types";

interface CategoryCardProps {
	category: Category;
	colorIndex: number;
	onEdit: (category: Category) => void;
	onRemove: (category: Category) => void;
}

export function CategoryCard({
	category,
	colorIndex,
	onEdit,
	onRemove,
}: CategoryCardProps) {
	const categoriasProtegidas = [
		"Transferência interna",
		"Saldo inicial",
		"Pagamentos",
	];
	const isProtegida = categoriasProtegidas.includes(category.name);

	const actions = [
		{
			label: "editar",
			icon: <RiPencilLine className="size-4" aria-hidden />,
			onClick: () => onEdit(category),
			variant: "default" as const,
			disabled: isProtegida,
		},
		{
			label: "detalhes",
			icon: <RiFileList2Line className="size-4" aria-hidden />,
			href: `/categorias/${category.id}`,
			variant: "default" as const,
			disabled: false,
		},
		{
			label: "remover",
			icon: <RiDeleteBin5Line className="size-4" aria-hidden />,
			onClick: () => onRemove(category),
			variant: "destructive" as const,
			disabled: isProtegida,
		},
	].filter((action) => !action.disabled);

	return (
		<Card className="flex h-full flex-col gap-0 py-3">
			<CardContent className="flex flex-1 flex-col">
				<div className="flex items-center gap-3">
					<CategoryIconBadge
						icon={category.icon}
						name={category.name}
						colorIndex={colorIndex}
						size="md"
					/>
					<h3 className="leading-tight">{category.name}</h3>
				</div>
			</CardContent>

			<CardFooter className="flex flex-wrap gap-3 px-6 pt-4 text-sm">
				{actions.map(({ label, icon, onClick, href, variant }) => {
					const className = cn(
						"flex items-center gap-1 font-medium transition-opacity hover:opacity-80",
						variant === "destructive" ? "text-destructive" : "text-primary",
					);

					if (href) {
						return (
							<Link key={label} href={href} className={className}>
								{icon}
								{label}
							</Link>
						);
					}

					return (
						<button
							key={label}
							type="button"
							onClick={onClick}
							className={className}
						>
							{icon}
							{label}
						</button>
					);
				})}
			</CardFooter>
		</Card>
	);
}
