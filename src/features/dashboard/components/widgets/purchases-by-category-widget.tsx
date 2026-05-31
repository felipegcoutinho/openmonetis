"use client";

import { RiFileList2Line, RiStore3Line } from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PurchasesByCategoryData } from "@/features/dashboard/categories/purchases-by-category-queries";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { CATEGORY_TYPE_LABEL } from "@/shared/lib/categories/constants";
import { formatTransactionDate } from "@/shared/utils/date";

type PurchasesByCategoryWidgetProps = {
	data: PurchasesByCategoryData;
};

const STORAGE_KEY = "purchases-by-category-selected";

export function PurchasesByCategoryWidget({
	data,
}: PurchasesByCategoryWidgetProps) {
	const firstCategoryId = data.categories[0]?.id ?? "";
	const hasRestoredSelectionRef = useRef(false);
	const hasPersistedSelectionRef = useRef(false);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string>(firstCategoryId);

	// Agrupa categorias por tipo
	const categoriesByType = useMemo(() => {
		const grouped: Record<string, typeof data.categories> = {};

		for (const category of data.categories) {
			if (!grouped[category.type]) {
				grouped[category.type] = [];
			}
			const typeGroup = grouped[category.type];
			if (typeGroup) {
				typeGroup.push(category);
			}
		}

		return grouped;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data.categories]);

	// Restaura a categoria salva apenas depois da montagem para manter SSR e cliente consistentes.
	useEffect(() => {
		if (hasRestoredSelectionRef.current) {
			return;
		}

		hasRestoredSelectionRef.current = true;

		const saved = sessionStorage.getItem(STORAGE_KEY);
		if (saved && data.categories.some((cat) => cat.id === saved)) {
			setSelectedCategoryId(saved);
			return;
		}

		setSelectedCategoryId(firstCategoryId);
	}, [data.categories, firstCategoryId]);

	// Salva a categoria selecionada quando mudar, sem sobrescrever o valor salvo na primeira montagem.
	useEffect(() => {
		if (!hasPersistedSelectionRef.current) {
			hasPersistedSelectionRef.current = true;
			return;
		}

		if (selectedCategoryId) {
			sessionStorage.setItem(STORAGE_KEY, selectedCategoryId);
			return;
		}

		sessionStorage.removeItem(STORAGE_KEY);
	}, [selectedCategoryId]);

	// Atualiza a categoria selecionada se ela não existir mais na lista
	useEffect(() => {
		if (!selectedCategoryId && firstCategoryId) {
			setSelectedCategoryId(firstCategoryId);
			return;
		}

		if (
			selectedCategoryId &&
			!data.categories.some((cat) => cat.id === selectedCategoryId)
		) {
			setSelectedCategoryId(firstCategoryId);
		}
	}, [data.categories, firstCategoryId, selectedCategoryId]);

	const currentTransactions = useMemo(() => {
		if (!selectedCategoryId) {
			return [];
		}
		return data.transactionsByCategory[selectedCategoryId] ?? [];
	}, [selectedCategoryId, data.transactionsByCategory]);

	const selectedCategory = useMemo(() => {
		return data.categories.find((cat) => cat.id === selectedCategoryId);
	}, [data.categories, selectedCategoryId]);

	if (data.categories.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiStore3Line className="size-6 text-muted-foreground" />}
				title="Nenhuma categoria encontrada"
				description="Crie categorias de despesas ou receitas para visualizar as compras."
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4 px-0">
			<div className="flex items-center gap-3">
				<Select
					value={selectedCategoryId}
					onValueChange={setSelectedCategoryId}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Selecione uma categoria" />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(categoriesByType).map(([type, categories]) => (
							<SelectGroup key={type}>
								<SelectLabel className="font-medium">
									{CATEGORY_TYPE_LABEL[
										type as keyof typeof CATEGORY_TYPE_LABEL
									] ?? type}
								</SelectLabel>
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.id}>
										{category.name}
									</SelectItem>
								))}
							</SelectGroup>
						))}
					</SelectContent>
				</Select>
			</div>

			{currentTransactions.length === 0 ? (
				<WidgetEmptyState
					icon={<RiFileList2Line className="size-6 text-muted-foreground" />}
					title="Nenhum lançamento encontrado"
					description={
						selectedCategory
							? `Não há lançamentos na categoria "${selectedCategory.name}".`
							: "Selecione uma categoria para visualizar os lançamentos."
					}
				/>
			) : (
				<div className="flex flex-col">
					{currentTransactions.map((transaction) => {
						return (
							<div
								key={transaction.id}
								className="flex items-center justify-between gap-2 transition-all duration-300 py-1.5"
							>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<EstablishmentLogo name={transaction.name} size={37} />

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{transaction.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatTransactionDate(transaction.purchaseDate)}
										</p>
									</div>
								</div>

								<div className="shrink-0 text-foreground">
									<MoneyValues
										className="font-medium"
										amount={transaction.amount}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
