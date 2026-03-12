import { MonthlyCalendar } from "@/features/calendar/components/monthly-calendar";
import { fetchCalendarData } from "@/features/calendar/queries";
import {
	getSingleParam,
	type ResolvedSearchParams,
} from "@/features/transactions/page-helpers";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUserId } from "@/shared/lib/auth/server";
import type { CalendarPeriod } from "@/shared/lib/types/calendar";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<ResolvedSearchParams>;

type PageProps = {
	searchParams?: PageSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
	const userId = await getUserId();
	const resolvedParams = searchParams ? await searchParams : undefined;

	const periodoParam = getSingleParam(resolvedParams, "periodo");
	const { period, monthName, year } = parsePeriodParam(periodoParam);

	const calendarData = await fetchCalendarData({
		userId,
		period,
	});

	const calendarPeriod: CalendarPeriod = {
		period,
		monthName,
		year,
	};

	return (
		<main className="flex flex-col gap-3">
			<MonthNavigation />
			<MonthlyCalendar
				period={calendarPeriod}
				events={calendarData.events}
				formOptions={calendarData.formOptions}
			/>
		</main>
	);
}
