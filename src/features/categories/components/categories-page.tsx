"use client";

import {
	RiAddFill,
	RiDeleteBin5Line,
	RiExternalLinkLine,
	RiPencilLine,
} from "@remixicon/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteCategoryAction } from "@/features/categories/actions";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
	CATEGORY_TYPE_LABEL,
	CATEGORY_TYPES,
	type CategoryType,
} from "@/shared/lib/categories/constants";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import { CategoryDialog } from "./category-dialog";
import type { Category } from "./types";

const CATEGORIAS_PROTEGIDAS = [
	"Transferência interna",
	"Saldo inicial",
	"Pagamentos",
];

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

	const handleEdit = (category: Category) => {
		setSelectedCategory(category);
		setEditOpen(true);
	};

	const handleEditOpenChange = (open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedCategory(null);
		}
	};

	const handleRemoveRequest = (category: Category) => {
		setCategoryToRemove(category);
		setRemoveOpen(true);
	};

	const handleRemoveOpenChange = (open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setCategoryToRemove(null);
		}
	};

	const handleRemoveConfirm = async () => {
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
	};

	const removeTitle = categoryToRemove
		? `Remover categoria "${categoryToRemove.name}"?`
		: "Remover categoria?";

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex">
					<CategoryDialog
						mode="create"
						defaultType={activeType}
						trigger={
							<Button className="w-full sm:w-auto">
								<RiAddFill className="size-4" />
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
								<Card className="py-2">
									<CardContent className="px-2 py-4 sm:px-4">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-10" />
													<TableHead>Nome</TableHead>
													<TableHead className="text-right">Ações</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{categoriesByType[type].map((category, index) => {
													const isProtegida = CATEGORIAS_PROTEGIDAS.includes(
														category.name,
													);

													return (
														<TableRow key={category.id}>
															<TableCell>
																<CategoryIconBadge
																	icon={category.icon}
																	name={category.name}
																	size="md"
																/>
															</TableCell>
															<TableCell className="font-medium">
																<Link
																	href={`/categories/${category.id}`}
																	className="inline-flex items-center gap-1 underline-offset-2 hover:text-primary hover:underline font-semibold"
																>
																	{category.name}
																	<RiExternalLinkLine
																		className="size-3 shrink-0 text-muted-foreground"
																		aria-hidden
																	/>
																</Link>
															</TableCell>
															<TableCell>
																<div className="flex items-center justify-end gap-3 text-sm">
																	{!isProtegida && (
																		<button
																			type="button"
																			onClick={() => handleEdit(category)}
																			className="flex items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80"
																		>
																			<RiPencilLine
																				className="size-4"
																				aria-hidden
																			/>
																			editar
																		</button>
																	)}
																	{!isProtegida && (
																		<button
																			type="button"
																			onClick={() =>
																				handleRemoveRequest(category)
																			}
																			className="flex items-center gap-1 font-medium text-destructive transition-opacity hover:opacity-80"
																		>
																			<RiDeleteBin5Line
																				className="size-4"
																				aria-hidden
																			/>
																			remover
																		</button>
																	)}
																</div>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
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
