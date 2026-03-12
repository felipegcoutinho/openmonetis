"use client";

import { RiArrowDownSFill, RiStore3Line } from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PurchasesByCategoryData } from "@/features/dashboard/purchases-by-category-queries";
import { EstabelecimentoLogo } from "@/features/transactions/components/shared/establishment-logo";
import MoneyValues from "@/shared/components/money-values";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { CATEGORY_TYPE_LABEL } from "@/shared/lib/categories/constants";

type PurchasesByCategoryWidgetProps = {
	data: PurchasesByCategoryData;
};

const formatTransactionDate = (date: Date | string) => {
	const d = date instanceof Date ? date : new Date(date);
	const formatter = new Intl.DateTimeFormat("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		timeZone: "UTC",
	});

	const formatted = formatter.format(d);
	// Capitaliza a primeira letra do dia da semana
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
							<div key={type}>
								<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
									{CATEGORY_TYPE_LABEL[
										type as keyof typeof CATEGORY_TYPE_LABEL
									] ?? type}
								</div>
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.id}>
										{category.name}
									</SelectItem>
								))}
							</div>
						))}
					</SelectContent>
				</Select>
			</div>

			{currentTransactions.length === 0 ? (
				<WidgetEmptyState
					icon={<RiArrowDownSFill className="size-6 text-muted-foreground" />}
					title="Nenhuma compra encontrada"
					description={
						selectedCategory
							? `Não há lançamentos na categoria "${selectedCategory.name}".`
							: "Selecione uma categoria para visualizar as compras."
					}
				/>
			) : (
				<ul className="flex flex-col">
					{currentTransactions.map((transaction) => {
						return (
							<li
								key={transaction.id}
								className="flex items-center justify-between gap-3 border-b border-dashed py-2 last:border-b-0 last:pb-0"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<EstabelecimentoLogo name={transaction.name} size={37} />

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
									<MoneyValues amount={transaction.amount} />
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
