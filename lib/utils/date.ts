/**
 * Date utilities - Functions for date manipulation and formatting
 *
 * This module consolidates date-related utilities from:
 * - /lib/utils/date.ts (basic date manipulation)
 * - /lib/date/index.ts (formatting and display)
 *
 * Note: Period-related functions (YYYY-MM) are in /lib/utils/period
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const WEEKDAY_NAMES = [
	"Domingo",
	"Segunda",
	"Terça",
	"Quarta",
	"Quinta",
	"Sexta",
	"Sábado",
] as const;

const MONTH_NAMES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
] as const;

// ============================================================================
// DATE CREATION & MANIPULATION
// ============================================================================

/**
 * Safely parses a date string (YYYY-MM-DD) as a local date
 *
 * IMPORTANT: new Date("2025-11-25") treats the date as UTC midnight,
 * which in Brazil (UTC-3) becomes 2025-11-26 03:00 local time!
 *
 * This function always interprets the date string in the local timezone.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseLocalDateString(dateString: string): Date {
	const [year, month, day] = dateString.split("-");
	return new Date(
		Number.parseInt(year ?? "0", 10),
		Number.parseInt(month ?? "1", 10) - 1,
		Number.parseInt(day ?? "1", 10),
	);
}

/**
 * Gets today's date as YYYY-MM-DD string
 * @returns Formatted date string
 */
export function getTodayDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

/**
 * Gets today's date as Date object
 * @returns Date object for today
 */
export function getTodayDate(): Date {
	return parseLocalDateString(getTodayDateString());
}

/**
 * Gets today's info (date and period)
 * @returns Object with date and period
 */
export function getTodayInfo(): { date: Date; period: string } {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const day = now.getDate();

	return {
		date: new Date(year, month, day),
		period: `${year}-${String(month + 1).padStart(2, "0")}`,
	};
}

/**
 * Adds months to a date
 * @param value - Date to add months to
 * @param offset - Number of months to add (can be negative)
 * @returns New date with months added
 */
export function addMonthsToDate(value: Date, offset: number): Date {
	const result = new Date(value);
	const originalDay = result.getDate();

	result.setDate(1);
	result.setMonth(result.getMonth() + offset);

	const lastDay = new Date(
		result.getFullYear(),
		result.getMonth() + 1,
		0,
	).getDate();

	result.setDate(Math.min(originalDay, lastDay));
	return result;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formats a date string (YYYY-MM-DD) to short display format
 * @example
 * formatDate("2024-11-14") // "qui 14 nov"
 */
export function formatDate(value: string): string {
	const parsed = parseLocalDateString(value);

	return new Intl.DateTimeFormat("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "short",
	})
		.format(parsed)
		.replace(".", "")
		.replace(" de", "");
}

/**
 * Formats a date to friendly long format
 * @example
 * friendlyDate(new Date()) // "Segunda, 14 de novembro de 2025"
 */
export function friendlyDate(date: Date): string {
	const weekday = WEEKDAY_NAMES[date.getDay()];
	const day = date.getDate();
	const month = MONTH_NAMES[date.getMonth()];
	const year = date.getFullYear();

	return `${weekday}, ${day} de ${month} de ${year}`;
}

// ============================================================================
// TIME-BASED UTILITIES
// ============================================================================

/**
 * Gets appropriate greeting based on time of day
 * @param date - Date to get greeting for (defaults to now)
 * @returns "Bom dia", "Boa tarde", or "Boa noite"
 */
export function getGreeting(date: Date = new Date()): string {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return "Bom dia";
	if (hour >= 12 && hour < 18) return "Boa tarde";
	return "Boa noite";
}

// Re-export MONTH_NAMES for convenience
export { MONTH_NAMES };
