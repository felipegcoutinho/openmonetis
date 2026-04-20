"use client";

import { DayCell } from "@/features/calendar/components/day-cell";
import type { CalendarDay } from "@/shared/lib/types/calendar";
import { WEEK_DAYS_SHORT } from "@/shared/utils/calendar";

type CalendarGridProps = {
	days: CalendarDay[];
	onSelectDay: (day: CalendarDay) => void;
	onCreateDay: (day: CalendarDay) => void;
};

export function CalendarGrid({
	days,
	onSelectDay,
	onCreateDay,
}: CalendarGridProps) {
	return (
		<div className="overflow-hidden rounded-lg border p-2">
			<div className="grid grid-cols-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				{WEEK_DAYS_SHORT.map((dayName) => (
					<span key={dayName} className="text-center">
						{dayName}
					</span>
				))}
			</div>

			<div className="grid grid-cols-7 gap-px px-px pb-px pt-px">
				{days.map((day) => (
					<div key={day.date} className="h-[150px] p-0.5">
						<DayCell day={day} onSelect={onSelectDay} onCreate={onCreateDay} />
					</div>
				))}
			</div>
		</div>
	);
}
