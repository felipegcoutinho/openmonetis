"use client";

import { RiPriceTag3Line } from "@remixicon/react";
import { CategoryIconBadge } from "@/components/categorias/category-icon-badge";
import MoneyValues from "@/components/money-values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { TopEstabelecimentosData } from "@/lib/top-estabelecimentos/fetch-data";
import { title_font } from "@/public/fonts/font_index";
import { Progress } from "../ui/progress";

type TopCategoriesProps = {
	categories: TopEstabelecimentosData["topCategories"];
};

export function TopCategories({ categories }: TopCategoriesProps) {
	if (categories.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-3">
					<CardTitle
						className={`${title_font.className} flex items-center gap-1.5 text-base`}
					>
						<RiPriceTag3Line className="size-4 text-primary" />
						Principais Categorias
					</CardTitle>
				</CardHeader>
				<CardContent>
					<WidgetEmptyState
						icon={<RiPriceTag3Line className="size-6 text-muted-foreground" />}
						title="Nenhuma categoria encontrada"
						description="Quando houver despesas categorizadas, elas aparecerão aqui."
					/>
				</CardContent>
			</Card>
		);
	}

	const totalAmount = categories.reduce((acc, c) => acc + c.totalAmount, 0);

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<CardTitle
					className={`${title_font.className} flex items-center gap-1.5 text-base`}
				>
					<RiPriceTag3Line className="size-4 text-primary" />
					Principais Categorias
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex flex-col">
					{categories.map((category, index) => {
						const percent =
							totalAmount > 0 ? (category.totalAmount / totalAmount) * 100 : 0;

						return (
							<div
								key={category.id}
								className="flex flex-col py-2 border-b border-dashed last:border-0"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<CategoryIconBadge
											icon={category.icon}
											name={category.name}
											colorIndex={index}
										/>

										{/* Name and percentage */}
										<div className="min-w-0 flex-1">
											<span className="text-sm font-medium truncate block">
												{category.name}
											</span>
											<span className="text-xs text-muted-foreground">
												{percent.toFixed(0)}% do total •{" "}
												{category.transactionCount}x
											</span>
										</div>
									</div>

									{/* Value */}
									<div className="flex shrink-0 flex-col items-end">
										<MoneyValues
											className="text-foreground"
											amount={category.totalAmount}
										/>
									</div>
								</div>

								{/* Progress bar */}
								<div className="ml-11 mt-1.5">
									<Progress className="h-1.5" value={percent} />
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
