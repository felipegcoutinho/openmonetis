"use client";

import {
	RiExchangeLine,
	RiMoneyDollarCircleLine,
	RiRepeatLine,
	RiStore2Line,
} from "@remixicon/react";
import type { TopEstabelecimentosData } from "@/features/reports/establishments/queries";
import MoneyValues from "@/shared/components/money-values";
import { Card, CardContent } from "@/shared/components/ui/card";

type SummaryCardsProps = {
	summary: TopEstabelecimentosData["summary"];
};

export function SummaryCards({ summary }: SummaryCardsProps) {
	const cards = [
		{
			title: "Estabelecimentos",
			value: summary.totalEstablishments,
			isMoney: false,
			icon: RiStore2Line,
			description: "Locais diferentes",
		},
		{
			title: "Transações",
			value: summary.totalTransactions,
			isMoney: false,
			icon: RiExchangeLine,
			description: "Compras no período",
		},
		{
			title: "Total Gasto",
			value: summary.totalSpent,
			isMoney: true,
			icon: RiMoneyDollarCircleLine,
			description: "Soma de todas as compras",
		},
		{
			title: "Ticket Médio",
			value: summary.avgPerTransaction,
			isMoney: true,
			icon: RiRepeatLine,
			description: "Média por transação",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.title}>
					<CardContent className="px-4 py-2">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">{card.title}</p>
								{card.isMoney ? (
									<MoneyValues
										className="text-2xl font-semibold"
										amount={card.value}
									/>
								) : (
									<p className="text-2xl font-semibold">{card.value}</p>
								)}
								<p className="text-xs text-muted-foreground">
									{card.description}
								</p>
							</div>
							<card.icon className="size-5 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
