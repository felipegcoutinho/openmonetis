"use client";

import { RiArrowDownLine, RiStore3Line } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/money-values";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CATEGORY_TYPE_LABEL } from "@/lib/categorias/constants";
import type { PurchasesByCategoryData } from "@/lib/dashboard/purchases-by-category";
import { WidgetEmptyState } from "../widget-empty-state";

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
	// Inicializa com a categoria salva ou a primeira disponível
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
		if (typeof window === "undefined") {
			const firstCategory = data.categories[0];
			return firstCategory ? firstCategory.id : "";
		}

		const saved = sessionStorage.getItem(STORAGE_KEY);
		if (saved && data.categories.some((cat) => cat.id === saved)) {
			return saved;
		}

		const firstCategory = data.categories[0];
		return firstCategory ? firstCategory.id : "";
	});

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

	// Salva a categoria selecionada quando mudar
	useEffect(() => {
		if (selectedCategoryId) {
			sessionStorage.setItem(STORAGE_KEY, selectedCategoryId);
		}
	}, [selectedCategoryId]);

	// Atualiza a categoria selecionada se ela não existir mais na lista
	useEffect(() => {
		if (
			selectedCategoryId &&
			!data.categories.some((cat) => cat.id === selectedCategoryId)
		) {
			const firstCategory = data.categories[0];
			if (firstCategory) {
				setSelectedCategoryId(firstCategory.id);
			} else {
				setSelectedCategoryId("");
			}
		}
	}, [data.categories, selectedCategoryId]);

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
					icon={<RiArrowDownLine className="size-6 text-muted-foreground" />}
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
