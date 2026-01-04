"use client";

import { useCallback, useMemo, useState } from "react";

import { LancamentoDialog } from "@/components/lancamentos/dialogs/lancamento-dialog/lancamento-dialog";

import type {
  CalendarDay,
  CalendarEvent,
  CalendarFormOptions,
  CalendarPeriod,
} from "@/components/calendario/types";
import { buildCalendarDays } from "@/components/calendario/utils";
import { CalendarGrid } from "@/components/calendario/calendar-grid";
import { CalendarLegend } from "@/components/calendario/calendar-legend";
import { EventModal } from "@/components/calendario/event-modal";

type MonthlyCalendarProps = {
  period: CalendarPeriod;
  events: CalendarEvent[];
  formOptions: CalendarFormOptions;
};

const parsePeriod = (period: string) => {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);

  return { year, monthIndex: month - 1 };
};

export function MonthlyCalendar({
  period,
  events,
  formOptions,
}: MonthlyCalendarProps) {
  const { year, monthIndex } = useMemo(
    () => parsePeriod(period.period),
    [period.period]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    });
    return map;
  }, [events]);

  const days = useMemo(
    () => buildCalendarDays({ year, monthIndex, events: eventsByDay }),
    [eventsByDay, monthIndex, year]
  );

  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const handleOpenCreate = useCallback((date: string) => {
    setCreateDate(date);
    setModalOpen(false);
    setCreateOpen(true);
  }, []);

  const handleDaySelect = useCallback((day: CalendarDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  }, []);

  const handleCreateFromCell = useCallback(
    (day: CalendarDay) => {
      handleOpenCreate(day.date);
    },
    [handleOpenCreate]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedDay(null);
  }, []);

  const handleCreateDialogChange = useCallback((open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setCreateDate(null);
    }
  }, []);

  return (
    <>
      <div className="space-y-3">
        <CalendarLegend />
        <CalendarGrid
          days={days}
          onSelectDay={handleDaySelect}
          onCreateDay={handleCreateFromCell}
        />
      </div>

      <EventModal
        open={isModalOpen}
        day={selectedDay}
        onClose={handleModalClose}
        onCreate={handleOpenCreate}
      />

      <LancamentoDialog
        mode="create"
        open={createOpen}
        onOpenChange={handleCreateDialogChange}
        pagadorOptions={formOptions.pagadorOptions}
        splitPagadorOptions={formOptions.splitPagadorOptions}
        defaultPagadorId={formOptions.defaultPagadorId}
        contaOptions={formOptions.contaOptions}
        cartaoOptions={formOptions.cartaoOptions}
        categoriaOptions={formOptions.categoriaOptions}
        estabelecimentos={formOptions.estabelecimentos}
        defaultPeriod={period.period}
        defaultPurchaseDate={createDate ?? undefined}
      />
    </>
  );
}
