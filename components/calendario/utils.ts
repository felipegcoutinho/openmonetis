import type { CalendarDay, CalendarEvent } from "@/components/calendario/types";

export const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getWeekdayIndex = (date: Date) => {
	const day = date.getUTCDay(); // 0 (domingo) - 6 (sábado)
	// Ajusta para segunda-feira como primeiro dia
	return day === 0 ? 6 : day - 1;
};

export const buildCalendarDays = ({
	year,
	monthIndex,
	events,
}: {
	year: number;
	monthIndex: number;
	events: Map<string, CalendarEvent[]>;
}): CalendarDay[] => {
	const startOfMonth = new Date(Date.UTC(year, monthIndex, 1));
	const offset = getWeekdayIndex(startOfMonth);
	const startDate = new Date(Date.UTC(year, monthIndex, 1 - offset));
	const totalCells = 42; // 6 semanas
	const now = new Date();
	const todayKey = formatDateKey(
		new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
	);

	const days: CalendarDay[] = [];

	for (let index = 0; index < totalCells; index += 1) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + index);

		const dateKey = formatDateKey(currentDate);
		const isCurrentMonth = currentDate.getUTCMonth() === monthIndex;
		const dateLabel = currentDate.getUTCDate().toString();
		const eventsForDay = events.get(dateKey) ?? [];

		days.push({
			date: dateKey,
			label: dateLabel,
			isCurrentMonth,
			isToday: dateKey === todayKey,
			events: eventsForDay,
		});
	}

	return days;
};

export const WEEK_DAYS_SHORT = [
	"Seg",
	"Ter",
	"Qua",
	"Qui",
	"Sex",
	"Sáb",
	"Dom",
];
