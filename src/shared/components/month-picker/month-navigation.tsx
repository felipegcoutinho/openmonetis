"use client";

import { RiArrowDropDownLine, RiCalendarLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
	dateToPeriod,
	getNextPeriod,
	getPreviousPeriod,
	periodToDate,
} from "@/shared/utils/period";
import LoadingSpinner from "./loading-spinner";
import NavigationButton from "./nav-button";
import ReturnButton from "./return-button";
import { useMonthPeriod } from "./use-month-period";

export default function MonthNavigation() {
	const { period, currentMonth, currentYear, defaultPeriod, buildHref } =
		useMonthPeriod();

	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const closePickerTimeout = useRef<ReturnType<typeof setTimeout>>(null);

	const currentMonthLabel = `${currentMonth.charAt(0).toUpperCase()}${currentMonth.slice(1)} ${currentYear}`;
	const prevTarget = buildHref(getPreviousPeriod(period));
	const nextTarget = buildHref(getNextPeriod(period));
	const returnTarget = buildHref(defaultPeriod);
	const isDifferentFromCurrent = period !== defaultPeriod;

	useEffect(() => {
		router.prefetch(prevTarget);
		router.prefetch(nextTarget);
		if (isDifferentFromCurrent) {
			router.prefetch(returnTarget);
		}
	}, [router, prevTarget, nextTarget, returnTarget, isDifferentFromCurrent]);

	useEffect(() => {
		return () => {
			if (closePickerTimeout.current) {
				clearTimeout(closePickerTimeout.current);
			}
		};
	}, []);

	const handleNavigate = (href: string) => {
		setIsPickerOpen(false);
		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	};

	const handlePickerOpen = () => {
		if (isPending) {
			return;
		}
		if (closePickerTimeout.current) {
			clearTimeout(closePickerTimeout.current);
		}
		setIsPickerOpen(true);
	};

	const handlePickerClose = () => {
		closePickerTimeout.current = setTimeout(() => {
			setIsPickerOpen(false);
		}, 150);
	};

	const handleMonthSelect = (date: Date) => {
		handleNavigate(buildHref(dateToPeriod(date)));
	};

	return (
		<Card className="sticky top-18 z-10 flex w-full flex-row items-center justify-between gap-2 px-3 py-3 backdrop-blur-md supports-backdrop-filter:bg-card/60 sm:px-4">
			<div className="flex min-w-0 items-center">
				<NavigationButton
					direction="left"
					disabled={isPending}
					onClick={() => handleNavigate(prevTarget)}
				/>

				<div className="flex min-w-0 items-center">
					<Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={isPending}
								onMouseEnter={handlePickerOpen}
								onMouseLeave={handlePickerClose}
								onFocus={handlePickerOpen}
								className="min-w-0 gap-1 px-1.5 font-semibold"
								aria-current={!isDifferentFromCurrent ? "date" : undefined}
								aria-label={`Selecionar período. Período atual: ${currentMonthLabel}`}
							>
								{isPending ? (
									<LoadingSpinner />
								) : (
									<RiCalendarLine className="size-4 text-primary" />
								)}
								<span className="truncate capitalize">{currentMonthLabel}</span>
								<RiArrowDropDownLine
									className="size-4 text-muted-foreground/50"
									aria-hidden
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto p-0"
							align="start"
							onMouseEnter={handlePickerOpen}
							onMouseLeave={handlePickerClose}
						>
							<MonthPicker
								selectedMonth={periodToDate(period)}
								onMonthSelect={handleMonthSelect}
							/>
						</PopoverContent>
					</Popover>
				</div>

				<NavigationButton
					direction="right"
					disabled={isPending}
					onClick={() => handleNavigate(nextTarget)}
				/>
			</div>

			{isDifferentFromCurrent && (
				<ReturnButton
					disabled={isPending}
					onClick={() => handleNavigate(returnTarget)}
				/>
			)}
		</Card>
	);
}
