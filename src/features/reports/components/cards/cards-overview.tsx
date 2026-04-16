"use client";

import { RiBankCard2Line } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CartoesReportData } from "@/features/reports/cards-report-queries";
import MoneyValues from "@/shared/components/money-values";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { resolveCardBrandAsset } from "@/shared/lib/cards/brand-assets";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { cn } from "@/shared/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPercentage } from "@/shared/utils/percentage";

type CardsOverviewProps = {
	data: CartoesReportData;
};

export function CardsOverview({ data }: CardsOverviewProps) {
	const searchParams = useSearchParams();
	const periodoParam = searchParams.get("periodo");

	const getUsageColor = (percent: number) => {
		if (percent < 50) return "bg-success";
		if (percent < 80) return "bg-warning";
		return "bg-destructive";
	};

	const buildUrl = (cardId: string) => {
		const params = new URLSearchParams();
		if (periodoParam) params.set("periodo", periodoParam);
		params.set("cartao", cardId);
		return `/reports/card-usage?${params.toString()}`;
	};

	const summaryCards = [
		{ title: "Limite", value: data.totalLimit, isMoney: true },
		{ title: "Usado", value: data.totalUsage, isMoney: true },
		{
			title: "Disponível",
			value: data.totalLimit - data.totalUsage,
			isMoney: true,
		},
		{ title: "Utilização", value: data.totalUsagePercent, isMoney: false },
	];

	if (data.cards.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
					<RiBankCard2Line className="size-8 mb-2" />
					<p className="text-sm">Nenhum cartão encontrado</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{/* Summary stats */}
			<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
				{summaryCards.map((card) => (
					<Card key={card.title}>
						<CardContent className="px-4">
							<p className="text-xs text-muted-foreground">{card.title}</p>
							{card.isMoney ? (
								<MoneyValues
									className="text-2xl font-semibold"
									amount={card.value}
								/>
							) : (
								<p className="text-2xl font-semibold">
									{formatPercentage(card.value, {
										maximumFractionDigits: 0,
										minimumFractionDigits: 0,
									})}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<p className="text-base font-semibold ml-2 py-2">Meus cartões</p>

			{/* Cards list */}
			<div className="grid gap-2 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
				{data.cards.map((card) => {
					const logoPath = resolveLogoSrc(card.logo);
					const brandAsset = resolveCardBrandAsset(card.brand);
					const isSelected = data.selectedCard?.card.id === card.id;

					return (
						<Card
							key={card.id}
							className={cn("px-1 py-1", isSelected && "ring-1 ring-primary")}
						>
							<Link
								href={buildUrl(card.id)}
								className={cn("flex items-center gap-3 p-3")}
							>
								<div className="flex size-9 shrink-0 items-center justify-center">
									{logoPath ? (
										<Image
											src={logoPath}
											alt={card.name}
											width={32}
											height={32}
											className="rounded-full object-contain"
										/>
									) : (
										<RiBankCard2Line className="size-5 text-muted-foreground" />
									)}
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-base font-semibold truncate">
											{card.name}
										</span>
										{brandAsset && (
											<Image
												src={brandAsset}
												alt={card.brand || ""}
												width={18}
												height={12}
												className="h-2.5 w-auto shrink-0 opacity-70"
											/>
										)}
									</div>
									<p className="text-xs text-muted-foreground">
										{formatCurrency(card.currentUsage)} /{" "}
										{formatCurrency(card.limit)}
									</p>
									<div className="flex items-center gap-2">
										<Progress
											value={Math.min(card.usagePercent, 100)}
											className={cn(
												"h-2 flex-1",
												`[&>div]:${getUsageColor(card.usagePercent)}`,
											)}
										/>
										<span className="text-xs font-medium">
											{formatPercentage(card.usagePercent, {
												maximumFractionDigits: 0,
												minimumFractionDigits: 0,
											})}
										</span>
									</div>
								</div>
							</Link>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
