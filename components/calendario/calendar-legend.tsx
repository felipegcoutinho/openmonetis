"use client";

import { EVENT_TYPE_STYLES } from "@/components/calendario/day-cell";
import type { CalendarEvent } from "@/components/calendario/types";
import { cn } from "@/lib/utils/ui";

const LEGEND_ITEMS: Array<{
  type?: CalendarEvent["type"];
  label: string;
  dotColor?: string;
}> = [
  { type: "lancamento", label: "Lançamentos" },
  { type: "boleto", label: "Boleto com vencimento" },
  { type: "cartao", label: "Vencimento de cartão" },
  { label: "Pagamento fatura", dotColor: "bg-green-600" },
];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-sm border border-border/60 bg-muted/20 p-2 text-xs font-medium text-muted-foreground">
      {LEGEND_ITEMS.map((item, index) => {
        const dotColor =
          item.dotColor || (item.type ? EVENT_TYPE_STYLES[item.type].dot : "");
        return (
          <span key={item.type || index} className="flex items-center gap-2">
            <span className={cn("size-3 rounded-full", dotColor)} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
