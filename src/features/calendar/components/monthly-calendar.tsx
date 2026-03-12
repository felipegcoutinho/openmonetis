"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "@/features/calendar/components/calendar-grid";
import { CalendarLegend } from "@/features/calendar/components/calendar-legend";
import { EventModal } from "@/features/calendar/components/event-modal";
import { LancamentoDialog } from "@/features/transactions/components/dialogs/transaction-dialog/transaction-dialog";
import type {
	CalendarDay,
	CalendarEvent,
	CalendarFormOptions,
	CalendarPeriod,
} from "@/shared/lib/types/calendar";
import { buildCalendarDays } from "@/shared/utils/calendar";
import { parsePeriod } from "@/shared/utils/period";

type MonthlyCalendarProps = {
	period: CalendarPeriod;
	events: CalendarEvent[];
	formOptions: CalendarFormOptions;
};

export function MonthlyCalendar({
	period,
	events,
	formOptions,
}: MonthlyCalendarProps) {
	const { year, month } = parsePeriod(period.period);
	const monthIndex = month - 1;

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
		[eventsByDay, monthIndex, year],
	);

	const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
	const [isModalOpen, setModalOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [createDate, setCreateDate] = useState<string | null>(null);

	const handleOpenCreate = (date: string) => {
		setCreateDate(date);
		setModalOpen(false);
		setCreateOpen(true);
	};

	const handleDaySelect = (day: CalendarDay) => {
		setSelectedDay(day);
		setModalOpen(true);
	};

	const handleCreateFromCell = (day: CalendarDay) => {
		handleOpenCreate(day.date);
	};

	const handleModalClose = () => {
		setModalOpen(false);
		setSelectedDay(null);
	};

	const handleCreateDialogChange = (open: boolean) => {
		setCreateOpen(open);
		if (!open) {
			setCreateDate(null);
		}
	};

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
