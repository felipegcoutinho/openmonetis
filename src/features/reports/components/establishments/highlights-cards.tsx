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
			<Card className="bg-linear-to-br from-violet-50 to-violet-50/50 dark:from-violet-950/20 dark:to-violet-950/10">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-10 rounded-xl bg-violet-100 dark:bg-violet-900/40">
							<RiTrophyLine className="size-5 text-violet-600 dark:text-violet-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs text-violet-700/80 dark:text-violet-400/80 font-medium">
								Mais Frequente
							</p>
							<p className="font-bold text-xl text-violet-900 dark:text-violet-100 truncate">
								{summary.mostFrequent || "—"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="bg-linear-to-br from-red-50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/10">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-10 rounded-xl bg-red-100 dark:bg-red-900/40">
							<RiFireLine className="size-5 text-red-600 dark:text-red-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs text-red-700/80 dark:text-red-400/80 font-medium">
								Maior Gasto Total
							</p>
							<p className="font-bold text-xl text-red-900 dark:text-red-100 truncate">
								{summary.highestSpending || "—"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
