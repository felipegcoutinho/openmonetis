"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { MONTH_NAMES } from "@/lib/utils/period";

const PERIOD_PARAM = "periodo";

const normalizeMonth = (value: string) => value.trim().toLowerCase();

export function useMonthPeriod() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	// Get current date info
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonthName = MONTH_NAMES[now.getMonth()];
	const optionsMeses = useMemo(() => [...MONTH_NAMES], []);

	const defaultMonth = currentMonthName;
	const defaultYear = currentYear.toString();

	const periodFromParams = searchParams.get(PERIOD_PARAM);

	const { month: currentMonth, year: currentYearValue } = useMemo(() => {
		if (!periodFromParams) {
			return { month: defaultMonth, year: defaultYear };
		}

		const [rawMonth, rawYear] = periodFromParams.split("-");
		const normalizedMonth = normalizeMonth(rawMonth ?? "");
		const normalizedYear = (rawYear ?? "").trim();
		const monthExists = optionsMeses.includes(normalizedMonth);
		const parsedYear = Number.parseInt(normalizedYear, 10);

		if (!monthExists || Number.isNaN(parsedYear)) {
			return { month: defaultMonth, year: defaultYear };
		}

		return {
			month: normalizedMonth,
			year: parsedYear.toString(),
		};
	}, [periodFromParams, defaultMonth, defaultYear, optionsMeses]);

	const buildHref = (month: string, year: string | number) => {
		const normalizedMonth = normalizeMonth(month);
		const normalizedYear = String(year).trim();

		const params = new URLSearchParams(searchParams.toString());
		params.set(PERIOD_PARAM, `${normalizedMonth}-${normalizedYear}`);

		return `${pathname}?${params.toString()}`;
	};

	const replacePeriod = (target: string) => {
		if (!target) {
			return;
		}

		router.replace(target, { scroll: false });
	};

	return {
		monthNames: optionsMeses,
		pathname,
		currentMonth,
		currentYear: currentYearValue,
		defaultMonth,
		defaultYear,
		buildHref,
		replacePeriod,
	};
}

export { PERIOD_PARAM as MONTH_PERIOD_PARAM };
