"use client";

import { RiAddLine, RiCheckboxCircleFill } from "@remixicon/react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { CalendarDay, CalendarEvent } from "@/shared/lib/types/calendar";
import { currencyFormatter } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

type DayCellProps = {
	day: CalendarDay;
	onSelect: (day: CalendarDay) => void;
	onCreate: (day: CalendarDay) => void;
};

export const EVENT_TYPE_STYLES: Record<
	CalendarEvent["type"],
	{ wrapper: string; dot: string }
> = {
	transaction: {
		wrapper: "bg-primary/10 text-primary dark:bg-primary/5 dark:text-primary",
		dot: "bg-primary",
	},
	installment: {
		wrapper:
			"bg-amber-100 text-amber-600 dark:bg-amber-900/10 dark:text-amber-500",
		dot: "bg-amber-500",
	},
	boleto: {
		wrapper: "bg-info/10 text-info dark:bg-info/5 dark:text-info",
		dot: "bg-info",
	},
	card: {
		wrapper:
			"bg-violet-100 text-violet-600 dark:bg-violet-900/10 dark:text-violet-500",
		dot: "bg-violet-600 dark:bg-violet-500",
	},
};

const formatCurrencyValue = (value: number | null | undefined) =>
	currencyFormatter.format(Math.abs(value ?? 0));

const buildEventLabel = (event: CalendarEvent) => {
	switch (event.type) {
		case "transaction":
		case "boleto":
			return event.transaction.name;
		case "installment":
			return event.transaction.name;
		case "card":
			return event.card.name;
		default:
			return "";
	}
};

const buildEventComplement = (event: CalendarEvent) => {
	switch (event.type) {
		case "transaction":
		case "boleto":
			return formatCurrencyValue(event.transaction.amount);
		case "installment":
			return `${event.installmentCount}x de ${formatCurrencyValue(event.installmentValue)}`;
		case "card":
			return event.card.totalDue !== null
				? formatCurrencyValue(event.card.totalDue)
				: null;
		default:
			return null;
	}
};

const isPaid = (event: CalendarEvent) => {
	if (event.type === "boleto") return Boolean(event.transaction.isSettled);
	if (event.type === "card") return event.card.isPaid;
	return false;
};

const DayEventPreview = ({ event }: { event: CalendarEvent }) => {
	const complement = buildEventComplement(event);
	const label = buildEventLabel(event);
	const style = EVENT_TYPE_STYLES[event.type];

	return (
		<div
			className={cn(
				"flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-xs",
				style.wrapper,
			)}
		>
			<div className="flex min-w-0 items-center gap-1">
				<span
					className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
					aria-hidden
				/>
				<span className="truncate">{label}</span>
				{isPaid(event) && (
					<RiCheckboxCircleFill className="size-3.5 shrink-0 text-success" />
				)}
			</div>
			{complement ? (
				<span className="shrink-0 font-medium">{complement}</span>
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

	const overflowCount = day.events.length - previewEvents.length;

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(day)}
			onKeyDown={handleKeyDown}
			className={cn(
				"group flex h-full cursor-pointer flex-col gap-1.5 rounded-lg border bg-card/80 p-2 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-accent",
				!day.isCurrentMonth && "bg-muted/20 opacity-60",
				day.isToday && "border-primary/70 bg-primary/5 hover:border-primary",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span
					className={cn(
						"text-sm font-medium leading-none",
						day.isToday
							? "text-primary-foreground bg-primary size-5 rounded-full flex items-center justify-center"
							: "text-foreground/90",
					)}
				>
					{day.label}
				</span>
				{day.isCurrentMonth && (
					<button
						type="button"
						onClick={handleCreateClick}
						className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-primary/20 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
						aria-label={`Criar lançamento em ${day.date}`}
					>
						<RiAddLine className="size-3.5" />
					</button>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-1.5">
				{day.isCurrentMonth &&
					previewEvents.map((event) => (
						<DayEventPreview key={event.id} event={event} />
					))}

				{day.isCurrentMonth && hasOverflow ? (
					<span className="text-xs font-medium text-primary/80">
						+{overflowCount} mais
					</span>
				) : null}
			</div>
		</div>
	);
}
