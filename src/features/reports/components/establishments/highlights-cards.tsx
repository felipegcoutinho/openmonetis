"use client";

import { RiFireLine, RiTrophyLine } from "@remixicon/react";
import type { TopEstabelecimentosData } from "@/features/reports/establishments/queries";
import { Card, CardContent } from "@/shared/components/ui/card";

type HighlightsCardsProps = {
	summary: TopEstabelecimentosData["summary"];
};

export function HighlightsCards({ summary }: HighlightsCardsProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<Card className="">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-10 rounded-md bg-primary">
							<RiTrophyLine className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium">Mais Frequente</p>
							<p className="font-semibold text-2xl truncate">
								{summary.mostFrequent || "—"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-10 rounded-md bg-primary">
							<RiFireLine className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium">Maior Gasto Total</p>
							<p className="font-semibold text-2xl truncate">
								{summary.highestSpending || "—"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
