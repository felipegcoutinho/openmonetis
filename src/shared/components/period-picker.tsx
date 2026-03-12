"use client";

import { RiCalendarLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
	dateToPeriod,
	formatMonthYearLabel,
	periodToDate,
} from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";

interface PeriodPickerProps {
	value: string; // "YYYY-MM" format
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	placeholder?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

export function PeriodPicker({
	value,
	onChange,
	disabled = false,
	className,
	placeholder = "Selecione o período",
	variant = "outline",
	size = "default",
}: PeriodPickerProps) {
	const [open, setOpen] = useState(false);

	const handleSelect = (date: Date) => {
		const period = dateToPeriod(date);
		onChange(period);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					disabled={disabled}
					className={cn(
						"justify-start text-left font-normal capitalize",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<RiCalendarLine className="h-4 w-4" />
					{value ? formatMonthYearLabel(value) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<MonthPicker
					selectedMonth={value ? periodToDate(value) : new Date()}
					onMonthSelect={handleSelect}
				/>
			</PopoverContent>
		</Popover>
	);
}
