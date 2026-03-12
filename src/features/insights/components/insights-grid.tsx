import {
	type RemixiconComponentType,
	RiChatAi3Line,
	RiEyeLine,
	RiFlashlightLine,
	RiLightbulbLine,
	RiRocketLine,
} from "@remixicon/react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import type {
	InsightCategoryId,
	InsightsResponse,
} from "@/shared/lib/schemas/insights";
import { INSIGHT_CATEGORIES } from "@/shared/lib/schemas/insights";
import { displayPeriod } from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";

interface InsightsGridProps {
	insights: InsightsResponse;
}

const CATEGORY_ICONS: Record<InsightCategoryId, RemixiconComponentType> = {
	behaviors: RiEyeLine,
	triggers: RiFlashlightLine,
	recommendations: RiLightbulbLine,
	improvements: RiRocketLine,
};

const CATEGORY_COLORS: Record<
	InsightCategoryId,
	{ titleText: string; chatAiIcon: string }
> = {
	behaviors: {
		titleText: "text-orange-700 dark:text-orange-400",
		chatAiIcon: "text-orange-600 dark:text-orange-400",
	},
	triggers: {
		titleText: "text-amber-700 dark:text-amber-400 ",
		chatAiIcon: "text-amber-600 dark:text-amber-400",
	},
	recommendations: {
		titleText: "text-sky-700 dark:text-sky-400",
		chatAiIcon: "text-sky-600 dark:text-sky-400",
	},
	improvements: {
		titleText: "text-emerald-700 dark:text-emerald-400",
		chatAiIcon: "text-emerald-600 dark:text-emerald-400",
	},
};

export function InsightsGrid({ insights }: InsightsGridProps) {
	const formattedPeriod = displayPeriod(insights.month);

	return (
		<div className="space-y-6">
			<div className="space-y-2 px-1 text-muted-foreground">
				<p>
					No período selecionado ({formattedPeriod}), identificamos os
					principais comportamentos e gatilhos que impactaram seu padrão de
					consumo.
				</p>
				<p>Segue um panorama prático com recomendações acionáveis.</p>
			</div>

			{/* Grid de Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{insights.categories.map((categoryData) => {
					const categoryConfig = INSIGHT_CATEGORIES[categoryData.category];
					const colors = CATEGORY_COLORS[categoryData.category];
					const Icon = CATEGORY_ICONS[categoryData.category];

					return (
						<Card
							key={categoryData.category}
							className="relative overflow-hidden"
						>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Icon className={cn("size-5", colors.chatAiIcon)} />
									<CardTitle className={cn("font-semibold", colors.titleText)}>
										{categoryConfig.title}
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								{categoryData.items.map((item, index) => (
									<div
										key={index}
										className="flex flex-1 border-b border-dashed py-2.5 gap-2 items-start last:border-0"
									>
										<RiChatAi3Line
											className={cn("size-4 shrink-0", colors.chatAiIcon)}
										/>
										<span className="text-sm">{item.text}</span>
									</div>
								))}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
