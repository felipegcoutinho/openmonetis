"use client";

import { EVENT_TYPE_STYLES } from "@/components/calendario/day-cell";
import type { CalendarDay, CalendarEvent } from "@/components/calendario/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { friendlyDate, parseLocalDateString } from "@/lib/utils/date";
import { cn } from "@/lib/utils/ui";
import type { ReactNode } from "react";
import MoneyValues from "../money-values";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

type EventModalProps = {
  open: boolean;
  day: CalendarDay | null;
  onClose: () => void;
  onCreate: (date: string) => void;
};

const EventCard = ({
  children,
  type,
  isPagamentoFatura = false,
}: {
  children: ReactNode;
  type: CalendarEvent["type"];
  isPagamentoFatura?: boolean;
}) => {
  const style = isPagamentoFatura
    ? { dot: "bg-green-600" }
    : EVENT_TYPE_STYLES[type];
  return (
    <Card className="flex flex-row gap-2 p-3 mb-1">
      <span
        className={cn("mt-1 size-3 shrink-0 rounded-full", style.dot)}
        aria-hidden
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </Card>
  );
};

const renderLancamento = (
  event: Extract<CalendarEvent, { type: "lancamento" }>
) => {
  const isReceita = event.lancamento.transactionType === "Receita";
  const isPagamentoFatura =
    event.lancamento.name.startsWith("Pagamento fatura -");

  return (
    <EventCard type="lancamento" isPagamentoFatura={isPagamentoFatura}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className={`text-sm font-semibold leading-tight ${
              isPagamentoFatura && "text-green-600 dark:text-green-400"
            }`}
          >
            {event.lancamento.name}
          </span>

          <div className="flex gap-1">
            <Badge variant={"outline"}>{event.lancamento.condition}</Badge>
            <Badge variant={"outline"}>{event.lancamento.paymentMethod}</Badge>
            <Badge variant={"outline"}>{event.lancamento.categoriaName}</Badge>
          </div>
        </div>
        <span
          className={cn(
            "text-sm font-semibold whitespace-nowrap",
            isReceita ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}
        >
          <MoneyValues
            showPositiveSign
            className="text-base"
            amount={event.lancamento.amount}
          />
        </span>
      </div>
    </EventCard>
  );
};

const renderBoleto = (event: Extract<CalendarEvent, { type: "boleto" }>) => {
  const isPaid = Boolean(event.lancamento.isSettled);
  const dueDate = event.lancamento.dueDate;
  const formattedDueDate = dueDate
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(dueDate))
    : null;

  return (
    <EventCard type="boleto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 items-center">
            <span className="text-sm font-semibold leading-tight">
              {event.lancamento.name}
            </span>

            {formattedDueDate && (
              <span className="text-xs text-muted-foreground leading-tight">
                Vence em {formattedDueDate}
              </span>
            )}
          </div>

          <Badge variant={"outline"}>{isPaid ? "Pago" : "Pendente"}</Badge>
        </div>
        <span className="font-semibold">
          <MoneyValues amount={event.lancamento.amount} />
        </span>
      </div>
    </EventCard>
  );
};

const renderCard = (event: Extract<CalendarEvent, { type: "cartao" }>) => (
  <EventCard type="cartao">
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex gap-1 items-center">
          <span className="text-sm font-semibold leading-tight">
            Vencimento Fatura - {event.card.name}
          </span>
        </div>

        <Badge variant={"outline"}>{event.card.status ?? "Fatura"}</Badge>
      </div>
      {event.card.totalDue !== null ? (
        <span className="font-semibold">
          <MoneyValues amount={event.card.totalDue} />
        </span>
      ) : null}
    </div>
  </EventCard>
);

const renderEvent = (event: CalendarEvent) => {
  switch (event.type) {
    case "lancamento":
      return renderLancamento(event);
    case "boleto":
      return renderBoleto(event);
    case "cartao":
      return renderCard(event);
    default:
      return null;
  }
};

export function EventModal({ open, day, onClose, onCreate }: EventModalProps) {
  const formattedDate = !day
    ? ""
    : friendlyDate(parseLocalDateString(day.date));

  const handleCreate = () => {
    if (!day) return;
    onClose();
    onCreate(day.date);
  };

  const description = day?.events.length
    ? "Confira os lançamentos e vencimentos cadastrados para este dia."
    : "Nenhum lançamento encontrado para este dia. Você pode criar um novo lançamento agora.";

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{formattedDate}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[380px] space-y-2 overflow-y-auto pr-2">
          {day?.events.length ? (
            day.events.map((event) => (
              <div key={event.id}>{renderEvent(event)}</div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Nenhum lançamento ou vencimento registrado. Clique em{" "}
              <span className="font-medium text-primary">Novo lançamento</span>{" "}
              para começar.
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!day}>
            Novo lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
