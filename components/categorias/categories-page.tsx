"use client";

import { RiAddCircleLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteCategoryAction } from "@/app/(dashboard)/categorias/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CATEGORY_TYPE_LABEL,
	CATEGORY_TYPES,
} from "@/lib/categorias/constants";
import { CategoryCard } from "./category-card";
import { CategoryDialog } from "./category-dialog";
import type { Category, CategoryType } from "./types";

interface CategoriesPageProps {
	categories: Category[];
}

export function CategoriesPage({ categories }: CategoriesPageProps) {
	const [activeType, setActiveType] = useState<CategoryType>(CATEGORY_TYPES[0]);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null,
	);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [categoryToRemove, setCategoryToRemove] = useState<Category | null>(
		null,
	);

	const categoriesByType = useMemo(() => {
		const base = Object.fromEntries(
			CATEGORY_TYPES.map((type) => [type, [] as Category[]]),
		) as Record<CategoryType, Category[]>;

		categories.forEach((category) => {
			base[category.type]?.push(category);
		});

		CATEGORY_TYPES.forEach((type) => {
			base[type].sort((a, b) =>
				a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
			);
		});

		return base;
	}, [categories]);

	const handleEdit = useCallback((category: Category) => {
		setSelectedCategory(category);
		setEditOpen(true);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedCategory(null);
		}
	}, []);

	const handleRemoveRequest = useCallback((category: Category) => {
		setCategoryToRemove(category);
		setRemoveOpen(true);
	}, []);

	const handleRemoveOpenChange = useCallback((open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setCategoryToRemove(null);
		}
	}, []);

	const handleRemoveConfirm = useCallback(async () => {
		if (!categoryToRemove) {
			return;
		}

		const result = await deleteCategoryAction({ id: categoryToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [categoryToRemove]);

	const removeTitle = categoryToRemove
		? `Remover categoria "${categoryToRemove.name}"?`
		: "Remover categoria?";

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex justify-start">
					<CategoryDialog
						mode="create"
						defaultType={activeType}
						trigger={
							<Button>
								<RiAddCircleLine className="size-4" />
								Nova categoria
							</Button>
						}
					/>
				</div>

				<Tabs
					value={activeType}
					onValueChange={(value) => setActiveType(value as CategoryType)}
					className="w-full"
				>
					<TabsList>
						{CATEGORY_TYPES.map((type) => (
							<TabsTrigger key={type} value={type}>
								{CATEGORY_TYPE_LABEL[type]}
							</TabsTrigger>
						))}
					</TabsList>

					{CATEGORY_TYPES.map((type) => (
						<TabsContent key={type} value={type} className="mt-4">
							{categoriesByType[type].length === 0 ? (
								<div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed bg-muted/10 p-10 text-center text-sm text-muted-foreground">
									Ainda não há categorias de{" "}
									{CATEGORY_TYPE_LABEL[type].toLowerCase()}.
								</div>
							) : (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{categoriesByType[type].map((category, index) => (
										<CategoryCard
											key={category.id}
											category={category}
											colorIndex={index}
											onEdit={handleEdit}
											onRemove={handleRemoveRequest}
										/>
									))}
								</div>
							)}
						</TabsContent>
					))}
				</Tabs>
			</div>

			<CategoryDialog
				mode="update"
				category={selectedCategory ?? undefined}
				open={editOpen && !!selectedCategory}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!categoryToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Ao remover esta categoria, os lançamentos associados serão desrelacionados."
				confirmLabel="Remover categoria"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>
		</>
	);
}
