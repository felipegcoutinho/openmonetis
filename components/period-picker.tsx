"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { RiCalendarLine } from "@remixicon/react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils/ui";

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

  // Convert period string (YYYY-MM) to Date object
  const periodToDate = (period: string): Date => {
    const [year, month] = period.split("-").map(Number);
    return new Date(year, month - 1, 1);
  };

  // Convert Date object to period string (YYYY-MM)
  const dateToPeriod = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Format date for display
  const formatDisplay = (period: string): string => {
    try {
      const date = periodToDate(period);
      return format(date, "MMMM yyyy", { locale: ptBR });
    } catch {
      return placeholder;
    }
  };

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
            className
          )}
        >
          <RiCalendarLine className="h-4 w-4" />
          {value ? formatDisplay(value) : placeholder}
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
