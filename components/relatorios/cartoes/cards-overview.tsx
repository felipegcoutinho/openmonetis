"use client";

import { RiBankCard2Line } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MoneyValues from "@/components/money-values";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CartoesReportData } from "@/lib/relatorios/cartoes-report";
import { cn } from "@/lib/utils";

type CardsOverviewProps = {
	data: CartoesReportData;
};

const BRAND_ASSETS: Record<string, string> = {
	visa: "/bandeiras/visa.svg",
	mastercard: "/bandeiras/mastercard.svg",
	amex: "/bandeiras/amex.svg",
	american: "/bandeiras/amex.svg",
	elo: "/bandeiras/elo.svg",
	hipercard: "/bandeiras/hipercard.svg",
	hiper: "/bandeiras/hipercard.svg",
};

const resolveBrandAsset = (brand: string | null) => {
	if (!brand) return null;
	const normalized = brand.trim().toLowerCase();
	const match = (
		Object.keys(BRAND_ASSETS) as Array<keyof typeof BRAND_ASSETS>
	).find((entry) => normalized.includes(entry));
	return match ? BRAND_ASSETS[match] : null;
};

const resolveLogoPath = (logo: string | null) => {
	if (!logo) return null;
	if (
		logo.startsWith("http://") ||
		logo.startsWith("https://") ||
		logo.startsWith("data:")
	) {
		return logo;
	}
	return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

export function CardsOverview({ data }: CardsOverviewProps) {
	const searchParams = useSearchParams();
	const periodoParam = searchParams.get("periodo");

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);

	const getUsageColor = (percent: number) => {
		if (percent < 50) return "bg-green-500";
		if (percent < 80) return "bg-yellow-500";
		return "bg-red-500";
	};

	const buildUrl = (cardId: string) => {
		const params = new URLSearchParams();
		if (periodoParam) params.set("periodo", periodoParam);
		params.set("cartao", cardId);
		return `/relatorios/uso-cartoes?${params.toString()}`;
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
						<CardContent className="px-4 py-2">
							<p className="text-xs text-muted-foreground mb-1">{card.title}</p>
							{card.isMoney ? (
								<MoneyValues
									className="text-2xl font-semibold"
									amount={card.value}
								/>
							) : (
								<p className="text-2xl font-semibold">
									{card.value.toFixed(0)}%
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<p className="text-base font-bold ml-2">Meus cartões</p>

			{/* Cards list */}
			<div className="grid gap-2 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
				{data.cards.map((card) => {
					const logoPath = resolveLogoPath(card.logo);
					const brandAsset = resolveBrandAsset(card.brand);
					const isSelected = data.selectedCard?.card.id === card.id;

					return (
						<Card
							key={card.id}
							className={cn("px-1 py-4", isSelected && "ring-1 ring-primary")}
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
											className="rounded-sm object-contain"
										/>
									) : (
										<RiBankCard2Line className="size-5 text-muted-foreground" />
									)}
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-base font-bold truncate">
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
									<p className="text-xs text-muted-foreground tabular-nums">
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
										<span className="text-xs font-medium tabular-nums">
											{card.usagePercent.toFixed(0)}%
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
