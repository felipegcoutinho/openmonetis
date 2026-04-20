"use client";

import { EVENT_TYPE_STYLES } from "@/features/calendar/components/day-cell";
import { cn } from "@/shared/utils/ui";

const LEGEND_ITEMS = [
	{ label: "Lançamentos", ...EVENT_TYPE_STYLES.transaction },
	{ label: "Boletos", ...EVENT_TYPE_STYLES.boleto },
	{ label: "Fatura de Cartão", ...EVENT_TYPE_STYLES.card },
];

export function CalendarLegend() {
	return (
		<ul className="flex items-center justify-start gap-2 px-1">
			{LEGEND_ITEMS.map((item) => (
				<li
					key={item.label}
					className={cn(
						"flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
						item.wrapper,
					)}
				>
					<span
						className={cn("size-1.5 shrink-0 rounded-full", item.dot)}
						aria-hidden
					/>
					{item.label}
				</li>
			))}
		</ul>
	);
}
