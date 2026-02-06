"use client";

import { RiStore2Line } from "@remixicon/react";
import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { TopEstabelecimentosData } from "@/lib/top-estabelecimentos/fetch-data";
import { Progress } from "../ui/progress";

type EstablishmentsListProps = {
	establishments: TopEstabelecimentosData["establishments"];
};

const buildInitials = (value: string) => {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "ES";
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "ES";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "ES";
};

export function EstablishmentsList({
	establishments,
}: EstablishmentsListProps) {
	if (establishments.length === 0) {
		return (
			<Card className="h-full">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-1.5 text-base">
						<RiStore2Line className="size-4 text-primary" />
						Top Estabelecimentos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<WidgetEmptyState
						icon={<RiStore2Line className="size-6 text-muted-foreground" />}
						title="Nenhum estabelecimento encontrado"
						description="Quando houver compras registradas, elas aparecerão aqui."
					/>
				</CardContent>
			</Card>
		);
	}

	const maxCount = Math.max(...establishments.map((e) => e.count));

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-1.5 text-base">
					<RiStore2Line className="size-4 text-primary" />
					Top Estabelecimentos por Frequência
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex flex-col">
					{establishments.map((establishment, index) => {
						const _initials = buildInitials(establishment.name);

						return (
							<div
								key={establishment.name}
								className="flex flex-col py-2 border-b border-dashed last:border-0"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										{/* Rank number - same size as icon containers */}
										<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
											<span className="text-sm font-semibold text-muted-foreground">
												{index + 1}
											</span>
										</div>

										{/* Name and categories */}
										<div className="min-w-0 flex-1">
											<span className="text-sm font-medium truncate block">
												{establishment.name}
											</span>
											<div className="flex items-center gap-1 mt-0.5 flex-wrap">
												{establishment.categories
													.slice(0, 2)
													.map((cat, catIndex) => (
														<Badge
															key={catIndex}
															variant="secondary"
															className="text-xs px-1.5 py-0 h-5"
														>
															{cat.name}
														</Badge>
													))}
											</div>
										</div>
									</div>

									{/* Value and stats */}
									<div className="flex shrink-0 flex-col items-end gap-0.5">
										<MoneyValues
											className="text-foreground"
											amount={establishment.totalAmount}
										/>
										<span className="text-xs text-muted-foreground">
											{establishment.count}x • Média:{" "}
											<MoneyValues
												className="text-xs"
												amount={establishment.avgAmount}
											/>
										</span>
									</div>
								</div>

								{/* Progress bar */}
								<div className="ml-12 mt-1.5">
									<Progress
										className="h-1.5"
										value={(establishment.count / maxCount) * 100}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
