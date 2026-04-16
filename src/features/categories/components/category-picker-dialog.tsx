"use client";

import { useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { CATEGORY_ICON_GROUPS } from "@/shared/lib/categories/icons";
import { cn } from "@/shared/utils/ui";

import { CategoryIcon } from "./category-icon";

interface CategoryPickerDialogProps {
	open: boolean;
	value: string;
	onOpenChange: (open: boolean) => void;
	onSelect: (icon: string) => void;
}

export function CategoryPickerDialog({
	open,
	value,
	onOpenChange,
	onSelect,
}: CategoryPickerDialogProps) {
	const [search, setSearch] = useState("");

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) setSearch("");
		onOpenChange(isOpen);
	};

	const filteredGroups = useMemo(() => {
		const query = search.toLowerCase().trim();
		if (!query) return CATEGORY_ICON_GROUPS;

		return CATEGORY_ICON_GROUPS.flatMap((group) => {
			const icons = group.icons.filter(
				(icon) =>
					icon.label.toLowerCase().includes(query) ||
					group.label.toLowerCase().includes(query),
			);
			return icons.length > 0 ? [{ ...group, icons }] : [];
		});
	}, [search]);

	const totalVisible = filteredGroups.reduce(
		(acc, g) => acc + g.icons.length,
		0,
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Escolher ícone</DialogTitle>
					<DialogDescription>
						Selecione o ícone que melhor representa esta categoria.
					</DialogDescription>
				</DialogHeader>

				<Input
					type="text"
					placeholder="Pesquisar ícone..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-8 text-sm"
					autoFocus
				/>

				{totalVisible === 0 ? (
					<p className="py-4 text-center text-sm text-muted-foreground">
						Nenhum ícone encontrado para &ldquo;{search}&rdquo;
					</p>
				) : (
					<div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
						{filteredGroups.map((group) => (
							<div key={group.label}>
								<p className="mb-2 text-xs text-muted-foreground">
									{group.label}
								</p>
								<div className="grid grid-cols-8 gap-1.5">
									{group.icons.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												onSelect(option.value);
												handleOpenChange(false);
											}}
											onPointerDown={(e) => e.stopPropagation()}
											aria-label={option.label}
											aria-pressed={value === option.value}
											title={option.label}
											className={cn(
												"flex size-10 items-center justify-center rounded-lg border transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
												value === option.value
													? "border-primary bg-primary/10 text-primary"
													: "border-border text-muted-foreground hover:text-primary",
											)}
										>
											<CategoryIcon name={option.value} className="size-5" />
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
