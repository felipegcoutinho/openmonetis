"use client";

import { EVENT_TYPE_STYLES } from "@/features/calendar/components/day-cell";
import StatusDot from "@/shared/components/status-dot";
import { Card } from "@/shared/components/ui/card";
import type { CalendarEvent } from "@/shared/lib/types/calendar";

const LEGEND_ITEMS: Array<{
	type?: CalendarEvent["type"];
	label: string;
	dotColor?: string;
}> = [
	{ type: "lancamento", label: "Lançamentos" },
	{ type: "boleto", label: "Boleto com vencimento" },
	{ type: "cartao", label: "Vencimento de cartão" },
	{ label: "Pagamento fatura", dotColor: "bg-success" },
];

export function CalendarLegend() {
	return (
		<Card className="flex flex-row gap-2 p-2 text-sm">
			{LEGEND_ITEMS.map((item, index) => {
				const dotColor =
					item.dotColor || (item.type ? EVENT_TYPE_STYLES[item.type].dot : "");
				return (
					<span key={item.type || index} className="flex items-center gap-2">
						<StatusDot color={dotColor} />
						{item.label}
					</span>
				);
			})}
		</Card>
	);
}
