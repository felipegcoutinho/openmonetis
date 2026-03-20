"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

import {
	formatPeriod,
	formatPeriodForUrl,
	parsePeriodParam,
} from "@/shared/utils/period";

const PERIOD_PARAM = "periodo";

export function useMonthPeriod() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const periodFromParams = searchParams.get(PERIOD_PARAM);
	const referenceDate = useRef(new Date()).current;
	const defaultPeriod = formatPeriod(
		referenceDate.getFullYear(),
		referenceDate.getMonth() + 1,
	);
	const { period, monthName, year } = parsePeriodParam(
		periodFromParams,
		referenceDate,
	);

	const buildHref = (targetPeriod: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set(PERIOD_PARAM, formatPeriodForUrl(targetPeriod));
		params.delete("page");

		return `${pathname}?${params.toString()}`;
	};

	return {
		period,
		currentMonth: monthName,
		currentYear: year.toString(),
		defaultPeriod,
		buildHref,
	};
}

export { PERIOD_PARAM as MONTH_PERIOD_PARAM };
