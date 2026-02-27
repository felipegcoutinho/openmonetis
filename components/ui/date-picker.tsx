"use client";

import { RiCalendarLine } from "@remixicon/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/ui";

function formatDate(date: Date | undefined, compact = false): string {
	if (!date) {
		return "";
	}

	if (compact) {
		return date
			.toLocaleDateString("pt-BR", {
				day: "numeric",
				month: "short",
			})
			.replace(".", "")
			.replace(" de ", " ");
	}

	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function isValidDate(date: Date | undefined): boolean {
	if (!date) {
		return false;
	}
	return !Number.isNaN(date.getTime());
}

function dateToYYYYMMDD(date: Date | undefined): string {
	if (!date || !isValidDate(date)) {
		return "";
	}
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseYYYYMMDD(dateString: string): Date | undefined {
	if (!dateString) {
		return undefined;
	}

	// Parse YYYY-MM-DD format as local date
	// IMPORTANT: new Date("2025-11-25") treats the date as UTC midnight,
	// which in Brazil (UTC-3) becomes 2025-11-26 03:00 local time!
	const ymdMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (ymdMatch) {
		const [, year, month, day] = ymdMatch;
		const date = new Date(Number(year), Number(month) - 1, Number(day));
		return isValidDate(date) ? date : undefined;
	}

	// For other formats, return undefined instead of using native parser
	// to avoid timezone issues
	return undefined;
}

export interface DatePickerProps {
	id?: string;
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	/** Show compact format like "10 mar" instead of "10 de março de 2025" */
	compact?: boolean;
}

export function DatePicker({
	id,
	value = "",
	onChange,
	placeholder = "Selecione uma data",
	required = false,
	disabled = false,
	className,
	compact = false,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);
	const [date, setDate] = React.useState<Date | undefined>(() =>
		parseYYYYMMDD(value),
	);
	const [month, setMonth] = React.useState<Date | undefined>(() =>
		parseYYYYMMDD(value),
	);
	const [displayValue, setDisplayValue] = React.useState(() =>
		formatDate(parseYYYYMMDD(value), compact),
	);

	// Sincronizar quando value externo mudar
	React.useEffect(() => {
		const newDate = parseYYYYMMDD(value);
		setDate(newDate);
		setMonth(newDate);
		setDisplayValue(formatDate(newDate, compact));
	}, [value, compact]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		setDisplayValue(inputValue);

		const parsedDate = parseYYYYMMDD(inputValue);
		if (isValidDate(parsedDate)) {
			setDate(parsedDate);
			setMonth(parsedDate);
			onChange?.(dateToYYYYMMDD(parsedDate));
		}
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setOpen(true);
		}
	};

	const handleCalendarSelect = (selectedDate: Date | undefined) => {
		setDate(selectedDate);
		setDisplayValue(formatDate(selectedDate, compact));
		onChange?.(dateToYYYYMMDD(selectedDate));
		setOpen(false);
	};

	return (
		<div className={cn("relative flex gap-2", className)}>
			<Input
				id={id}
				value={displayValue}
				placeholder={placeholder}
				className="bg-background pr-10"
				onChange={handleInputChange}
				onKeyDown={handleInputKeyDown}
				required={required}
				disabled={disabled}
			/>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						disabled={disabled}
						className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
						aria-label="Abrir calendário"
					>
						<RiCalendarLine className="size-3.5" />
						<span className="sr-only">Selecionar data</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto overflow-hidden p-0"
					align="end"
					alignOffset={-8}
					sideOffset={10}
				>
					<Calendar
						mode="single"
						selected={date}
						captionLayout="dropdown"
						month={month}
						onMonthChange={setMonth}
						onSelect={handleCalendarSelect}
						fromYear={2020}
						toYear={new Date().getFullYear() + 10}
						locale={{
							localize: {
								day: (n) => ["D", "S", "T", "Q", "Q", "S", "S"][n],
								month: (n) =>
									[
										"Jan",
										"Fev",
										"Mar",
										"Abr",
										"Mai",
										"Jun",
										"Jul",
										"Ago",
										"Set",
										"Out",
										"Nov",
										"Dez",
									][n],
							},
							formatLong: {
								date: () => "dd/MM/yyyy",
							},
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
