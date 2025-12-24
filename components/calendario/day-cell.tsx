"use client";

import type { CalendarDay, CalendarEvent } from "@/components/calendario/types";
import { currencyFormatter } from "@/lib/lancamentos/formatting-helpers";
import { cn } from "@/lib/utils/ui";
import { RiAddLine } from "@remixicon/react";
import type { KeyboardEvent, MouseEvent } from "react";

type DayCellProps = {
  day: CalendarDay;
  onSelect: (day: CalendarDay) => void;
  onCreate: (day: CalendarDay) => void;
};

export const EVENT_TYPE_STYLES: Record<
  CalendarEvent["type"],
  { wrapper: string; dot: string; accent?: string }
> = {
  lancamento: {
    wrapper:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/10 dark:text-orange-50 border-l-4 border-orange-500",
    dot: "bg-orange-600",
  },
  boleto: {
    wrapper:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/10 dark:text-blue-50 border-l-4 border-blue-500",
    dot: "bg-blue-600",
  },
  cartao: {
    wrapper:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/10 dark:text-violet-50 border-l-4 border-violet-500",
    dot: "bg-violet-600",
  },
};

const eventStyles = EVENT_TYPE_STYLES;

const formatCurrencyValue = (value: number | null | undefined) =>
  currencyFormatter.format(Math.abs(value ?? 0));

const formatAmount = (event: Extract<CalendarEvent, { type: "lancamento" }>) =>
  formatCurrencyValue(event.lancamento.amount);

const buildEventLabel = (event: CalendarEvent) => {
  switch (event.type) {
    case "lancamento": {
      return event.lancamento.name;
    }
    case "boleto": {
      return event.lancamento.name;
    }
    case "cartao": {
      return event.card.name;
    }
    default:
      return "";
  }
};

const buildEventComplement = (event: CalendarEvent) => {
  switch (event.type) {
    case "lancamento": {
      return formatAmount(event);
    }
    case "boleto": {
      return formatCurrencyValue(event.lancamento.amount);
    }
    case "cartao": {
      if (event.card.totalDue !== null) {
        return formatCurrencyValue(event.card.totalDue);
      }
      return null;
    }
    default:
      return null;
  }
};

const isPagamentoFatura = (event: CalendarEvent) => {
  return (
    event.type === "lancamento" &&
    event.lancamento.name.startsWith("Pagamento fatura -")
  );
};

const getEventStyle = (event: CalendarEvent) => {
  if (isPagamentoFatura(event)) {
    return {
      wrapper:
        "bg-green-100 text-green-600 dark:bg-green-900/10 dark:text-green-50 border-l-4 border-green-500",
      dot: "bg-green-600",
    };
  }
  return eventStyles[event.type];
};

const DayEventPreview = ({ event }: { event: CalendarEvent }) => {
  const complement = buildEventComplement(event);
  const label = buildEventLabel(event);
  const style = getEventStyle(event);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded p-1 text-xs",
        style.wrapper
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate">{label}</span>
      </div>
      {complement ? (
        <span
          className={cn("shrink-0 font-semibold", style.accent ?? "text-xs")}
        >
          {complement}
        </span>
      ) : null}
    </div>
  );
};

export function DayCell({ day, onSelect, onCreate }: DayCellProps) {
  const previewEvents = day.events.slice(0, 3);
  const hasOverflow = day.events.length > 3;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Space") {
      event.preventDefault();
      onSelect(day);
    }
  };

  const handleCreateClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCreate(day);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(day)}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-full cursor-pointer flex-col gap-1.5 rounded-lg border border-transparent bg-card/80 p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
        !day.isCurrentMonth && "opacity-60",
        day.isToday && "border-primary/70 bg-primary/5 hover:border-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold leading-none",
            day.isToday
              ? "text-orange-100 bg-primary size-5 rounded-full flex items-center justify-center"
              : "text-foreground/90"
          )}
        >
          {day.label}
        </span>
        <button
          type="button"
          onClick={handleCreateClick}
          className="flex size-6 items-center justify-center rounded-full border bg-muted text-muted-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          aria-label={`Criar lançamento em ${day.date}`}
        >
          <RiAddLine className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {previewEvents.map((event) => (
          <DayEventPreview key={event.id} event={event} />
        ))}

        {hasOverflow ? (
          <span className="text-xs font-medium text-primary/80">
            + ver mais
          </span>
        ) : null}
      </div>
    </div>
  );
}
