"use client";
import * as React from "react";
import { RiArrowLeftSFill, RiArrowRightSFill } from "@remixicon/react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils/ui";

type Month = {
  number: number;
  name: string;
};

const MONTHS: Month[][] = [
  [
    { number: 0, name: "Jan" },
    { number: 1, name: "Fev" },
    { number: 2, name: "Mar" },
    { number: 3, name: "Abr" },
  ],
  [
    { number: 4, name: "Mai" },
    { number: 5, name: "Jun" },
    { number: 6, name: "Jul" },
    { number: 7, name: "Ago" },
  ],
  [
    { number: 8, name: "Set" },
    { number: 9, name: "Out" },
    { number: 10, name: "Nov" },
    { number: 11, name: "Dez" },
  ],
];

type MonthCalProps = {
  selectedMonth?: Date;
  onMonthSelect?: (date: Date) => void;
  onYearForward?: () => void;
  onYearBackward?: () => void;
  callbacks?: {
    yearLabel?: (year: number) => string;
    monthLabel?: (month: Month) => string;
  };
  variant?: {
    calendar?: {
      main?: ButtonVariant;
      selected?: ButtonVariant;
    };
    chevrons?: ButtonVariant;
  };
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
};

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "link"
  | "destructive"
  | "secondary"
  | null
  | undefined;

function MonthPicker({
  onMonthSelect,
  selectedMonth,
  minDate,
  maxDate,
  disabledDates,
  callbacks,
  onYearBackward,
  onYearForward,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthCalProps) {
  return (
    <div className={cn("min-w-[200px] w-[280px] p-3", className)} {...props}>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0">
        <div className="space-y-4 w-full">
          <MonthCal
            onMonthSelect={onMonthSelect}
            callbacks={callbacks}
            selectedMonth={selectedMonth}
            onYearBackward={onYearBackward}
            onYearForward={onYearForward}
            variant={variant}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
          ></MonthCal>
        </div>
      </div>
    </div>
  );
}

function MonthCal({
  selectedMonth,
  onMonthSelect,
  callbacks,
  variant,
  minDate,
  maxDate,
  disabledDates,
  onYearBackward,
  onYearForward,
}: MonthCalProps) {
  const [year, setYear] = React.useState<number>(
    selectedMonth?.getFullYear() ?? new Date().getFullYear()
  );
  const [month, setMonth] = React.useState<number>(
    selectedMonth?.getMonth() ?? new Date().getMonth()
  );
  const [menuYear, setMenuYear] = React.useState<number>(year);

  if (minDate && maxDate && minDate > maxDate) minDate = maxDate;

  const disabledDatesMapped = disabledDates?.map((d) => {
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <>
      <div className="flex justify-center pt-1 relative items-center">
        <div className="text-sm font-bold">
          {callbacks?.yearLabel ? callbacks?.yearLabel(menuYear) : menuYear}
        </div>
        <div className="space-x-1 flex items-center">
          <button
            onClick={() => {
              setMenuYear(menuYear - 1);
              if (onYearBackward) onYearBackward();
            }}
            className={cn(
              buttonVariants({ variant: variant?.chevrons ?? "outline" }),
              "inline-flex items-center justify-center h-7 w-7 p-0 absolute left-1"
            )}
          >
            <RiArrowLeftSFill className="opacity-50 size-4" />
          </button>
          <button
            onClick={() => {
              setMenuYear(menuYear + 1);
              if (onYearForward) onYearForward();
            }}
            className={cn(
              buttonVariants({ variant: variant?.chevrons ?? "outline" }),
              "inline-flex items-center justify-center h-7 w-7 p-0 absolute right-1"
            )}
          >
            <RiArrowRightSFill className="opacity-50 size-4" />
          </button>
        </div>
      </div>
      <table className="w-full border-collapse space-y-1">
        <tbody>
          {MONTHS.map((monthRow, a) => {
            return (
              <tr key={"row-" + a} className="flex w-full mt-2">
                {monthRow.map((m) => {
                  return (
                    <td
                      key={m.number}
                      className="h-10 w-1/4 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                    >
                      <button
                        onClick={() => {
                          setMonth(m.number);
                          setYear(menuYear);
                          if (onMonthSelect)
                            onMonthSelect(new Date(menuYear, m.number));
                        }}
                        disabled={
                          (maxDate
                            ? menuYear > maxDate?.getFullYear() ||
                              (menuYear == maxDate?.getFullYear() &&
                                m.number > maxDate.getMonth())
                            : false) ||
                          (minDate
                            ? menuYear < minDate?.getFullYear() ||
                              (menuYear == minDate?.getFullYear() &&
                                m.number < minDate.getMonth())
                            : false) ||
                          (disabledDatesMapped
                            ? disabledDatesMapped?.some(
                                (d) => d.year == menuYear && d.month == m.number
                              )
                            : false)
                        }
                        className={cn(
                          buttonVariants({
                            variant:
                              month == m.number && menuYear == year
                                ? variant?.calendar?.selected ?? "default"
                                : variant?.calendar?.main ?? "ghost",
                          }),
                          "h-full w-full p-0 font-normal aria-selected:opacity-100"
                        )}
                      >
                        {callbacks?.monthLabel
                          ? callbacks.monthLabel(m)
                          : m.name}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

MonthPicker.displayName = "MonthPicker";

export { MonthPicker };
