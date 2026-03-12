"use client";

import { DayCell } from "@/features/calendar/components/day-cell";

import type { CalendarDay } from "@/shared/lib/types/calendar";
import { WEEK_DAYS_SHORT } from "@/shared/utils/calendar";
import { cn } from "@/shared/utils/ui";

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
		<div className="overflow-hidden rounded-lg bg-card drop-shadow-xs border-none">
			<div className="grid grid-cols-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				{WEEK_DAYS_SHORT.map((dayName) => (
					<span key={dayName} className="px-3 py-2 text-center text-primary">
						{dayName}
					</span>
				))}
			</div>

			<div className="grid grid-cols-7 gap-px bg-border/60 px-px pb-px pt-px">
				{days.map((day) => (
					<div
						key={day.date}
						className={cn("h-[150px] bg-card p-0.5", !day.isCurrentMonth && "")}
					>
						<DayCell day={day} onSelect={onSelectDay} onCreate={onCreateDay} />
					</div>
				))}
			</div>
		</div>
	);
}
