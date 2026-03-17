/**
 * Date utilities - Functions for date manipulation and formatting
 *
 * This module consolidates date-related utilities from:
 * - /lib/utils/date.ts (basic date manipulation)
 * - /lib/date/index.ts (formatting and display)
 *
 * Note: Period-related functions (YYYY-MM) are in /lib/utils/period
 */

import { capitalize } from "@/shared/utils/string";

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

export const OPENMONETIS_TIME_ZONE = "America/Sao_Paulo";

type DateOnlyParts = {
	year: number;
	month: number;
	day: number;
};

function buildDateOnlyString({ year, month, day }: DateOnlyParts): string {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateOnlyParts(value: string): DateOnlyParts | null {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return null;
	}

	const [, yearStr, monthStr, dayStr] = match;
	const year = Number.parseInt(yearStr ?? "", 10);
	const month = Number.parseInt(monthStr ?? "", 10);
	const day = Number.parseInt(dayStr ?? "", 10);

	if (
		Number.isNaN(year) ||
		Number.isNaN(month) ||
		Number.isNaN(day) ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) {
		return null;
	}

	const utcDate = new Date(Date.UTC(year, month - 1, day));
	if (
		utcDate.getUTCFullYear() !== year ||
		utcDate.getUTCMonth() !== month - 1 ||
		utcDate.getUTCDate() !== day
	) {
		return null;
	}

	return { year, month, day };
}

function getTimeZoneParts(
	date: Date,
	timeZone: string,
): { year: number; month: number; day: number; hour: number } {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(date);
	const getPart = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";

	return {
		year: Number.parseInt(getPart("year"), 10),
		month: Number.parseInt(getPart("month"), 10),
		day: Number.parseInt(getPart("day"), 10),
		hour: Number.parseInt(getPart("hour"), 10),
	};
}

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
	const parts = parseDateOnlyParts(dateString);
	if (!parts) {
		return new Date(Number.NaN);
	}

	return new Date(parts.year, parts.month - 1, parts.day);
}

/**
 * Safely parses a date string (YYYY-MM-DD) as UTC midnight
 */
export function parseUtcDateString(dateString: string): Date | null {
	const parts = parseDateOnlyParts(dateString);
	if (!parts) {
		return null;
	}

	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/**
 * Converts a Date or date string to YYYY-MM-DD
 */
export function toDateOnlyString(
	value: Date | string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	if (typeof value === "string") {
		const directValue = value.slice(0, 10);
		return parseDateOnlyParts(directValue) ? directValue : null;
	}

	if (Number.isNaN(value.getTime())) {
		return null;
	}

	return buildDateOnlyString({
		year: value.getUTCFullYear(),
		month: value.getUTCMonth() + 1,
		day: value.getUTCDate(),
	});
}

/**
 * Converts a local Date object to YYYY-MM-DD without timezone normalization
 */
export function toLocalDateString(
	value: Date | null | undefined,
): string | null {
	if (!value || Number.isNaN(value.getTime())) {
		return null;
	}

	return buildDateOnlyString({
		year: value.getFullYear(),
		month: value.getMonth() + 1,
		day: value.getDate(),
	});
}

/**
 * Gets today's date as YYYY-MM-DD string
 * @returns Formatted date string
 */
export function getTodayDateString(date: Date = new Date()): string {
	return toLocalDateString(date) ?? "";
}

/**
 * Gets a date string in YYYY-MM-DD format for a specific timezone
 */
export function getDateStringInTimeZone(
	timeZone: string,
	date: Date = new Date(),
): string {
	const parts = getTimeZoneParts(date, timeZone);
	return buildDateOnlyString(parts);
}

/**
 * Gets today's date using the app business timezone
 */
export function getBusinessDateString(date: Date = new Date()): string {
	return getDateStringInTimeZone(OPENMONETIS_TIME_ZONE, date);
}

/**
 * Gets today's date as Date object
 * @returns Date object for today
 */
export function getTodayDate(date: Date = new Date()): Date {
	return parseLocalDateString(getTodayDateString(date));
}

/**
 * Gets today's date as Date object using the app business timezone
 */
export function getBusinessTodayDate(date: Date = new Date()): Date {
	return parseLocalDateString(getBusinessDateString(date));
}

/**
 * Gets today's info (date and period)
 * @returns Object with date and period
 */
export function getTodayInfo(date: Date = new Date()): {
	date: Date;
	period: string;
} {
	const today = getTodayDateString(date);
	const parts = parseDateOnlyParts(today);
	if (!parts) {
		return { date: new Date(Number.NaN), period: "" };
	}

	return {
		date: new Date(parts.year, parts.month - 1, parts.day),
		period: `${parts.year}-${String(parts.month).padStart(2, "0")}`,
	};
}

/**
 * Gets today's info using the app business timezone
 */
export function getBusinessTodayInfo(date: Date = new Date()): {
	date: Date;
	period: string;
} {
	const today = getBusinessDateString(date);
	const parts = parseDateOnlyParts(today);
	if (!parts) {
		return { date: new Date(Number.NaN), period: "" };
	}

	return {
		date: new Date(parts.year, parts.month - 1, parts.day),
		period: `${parts.year}-${String(parts.month).padStart(2, "0")}`,
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
 * Formats a UTC date/datetime to short display format (weekday + day + month), capitalized.
 * Use this for timestamps stored as UTC (e.g. transaction dates from the DB).
 * @example
 * formatTransactionDate("2024-11-14T00:00:00Z") // "Qui 14 nov"
 */
export function formatTransactionDate(date: Date | string): string {
	const d = date instanceof Date ? date : new Date(date);
	const formatted = new Intl.DateTimeFormat("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		timeZone: "UTC",
	}).format(d);
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formats a date value to short display format
 * @example
 * formatDate("2024-11-14") // "qui 14 nov"
 */
export function formatDate(value: string | Date | null | undefined): string {
	const dateString = toDateOnlyString(value);
	if (!dateString) {
		return "—";
	}

	const parsed = parseLocalDateString(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return "—";
	}

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
 * Formats a date-only value (YYYY-MM-DD) using UTC to preserve the civil day
 */
export function formatDateOnly(
	value: string | Date | null | undefined,
	options: Intl.DateTimeFormatOptions = {},
): string | null {
	const dateString = toDateOnlyString(value);
	if (!dateString) {
		return null;
	}

	const parsed = parseUtcDateString(dateString);
	if (!parsed) {
		return null;
	}

	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
		...options,
	}).format(parsed);
}

export function formatDateTime(
	value: string | Date | null | undefined,
	options: Intl.DateTimeFormatOptions = {
		dateStyle: "short",
		timeStyle: "short",
	},
): string | null {
	if (!value) {
		return null;
	}

	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat("pt-BR", options).format(parsed);
}

export function formatDateOnlyLabel(
	value: string | Date | null | undefined,
	prefix?: string,
	options?: Intl.DateTimeFormatOptions,
): string | null {
	const formatted = formatDateOnly(value, options);
	if (!formatted) {
		return null;
	}

	return prefix ? `${prefix} ${formatted}` : formatted;
}

export function formatDateTimeLabel(
	value: string | Date | null | undefined,
	prefix?: string,
	options?: Intl.DateTimeFormatOptions,
): string | null {
	const formatted = formatDateTime(value, options);
	if (!formatted) {
		return null;
	}

	return prefix ? `${prefix} ${formatted}` : formatted;
}

export function compareDateOnly(
	left: string | Date | null | undefined,
	right: string | Date | null | undefined,
): number {
	const leftValue = toDateOnlyString(left);
	const rightValue = toDateOnlyString(right);

	if (!leftValue || !rightValue || leftValue === rightValue) {
		return 0;
	}

	return leftValue < rightValue ? -1 : 1;
}

export function isDateOnlyPast(
	value: string | Date | null | undefined,
	reference: string | Date | null | undefined = getBusinessDateString(),
): boolean {
	return compareDateOnly(value, reference) < 0;
}

export function isDateOnlyWithinDays(
	value: string | Date | null | undefined,
	daysThreshold: number,
	reference: string | Date | null | undefined = getBusinessDateString(),
): boolean {
	const dateValue = toDateOnlyString(value);
	const referenceValue = toDateOnlyString(reference);
	if (
		!dateValue ||
		!referenceValue ||
		compareDateOnly(dateValue, referenceValue) < 0
	) {
		return false;
	}

	const targetDate = parseUtcDateString(dateValue);
	const referenceDate = parseUtcDateString(referenceValue);
	if (!targetDate || !referenceDate) {
		return false;
	}

	const limitDate = new Date(referenceDate);
	limitDate.setUTCDate(limitDate.getUTCDate() + daysThreshold);
	return targetDate <= limitDate;
}

export function buildDateOnlyStringFromPeriodDay(
	period: string,
	dayValue: string | number,
): string | null {
	const [yearPart, monthPart] = period.split("-");
	const year = Number.parseInt(yearPart ?? "", 10);
	const month = Number.parseInt(monthPart ?? "", 10);
	const day = typeof dayValue === "number" ? dayValue : Number(dayValue);

	if (
		Number.isNaN(year) ||
		Number.isNaN(month) ||
		Number.isNaN(day) ||
		month < 1 ||
		month > 12 ||
		day < 1
	) {
		return null;
	}

	const daysInMonth = new Date(year, month, 0).getDate();
	const clampedDay = Math.min(day, daysInMonth);

	return buildDateOnlyString({
		year,
		month,
		day: clampedDay,
	});
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

export function getGreetingInTimeZone(
	timeZone: string,
	date: Date = new Date(),
): string {
	const { hour } = getTimeZoneParts(date, timeZone);
	if (hour >= 5 && hour < 12) return "Bom dia";
	if (hour >= 12 && hour < 18) return "Boa tarde";
	return "Boa noite";
}

export function getBusinessGreeting(date: Date = new Date()): string {
	return getGreetingInTimeZone(OPENMONETIS_TIME_ZONE, date);
}

export function formatCurrentDateInTimeZone(
	timeZone: string,
	date: Date = new Date(),
): string {
	return capitalize(
		new Intl.DateTimeFormat("pt-BR", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
			hour12: false,
			timeZone,
		}).format(date),
	);
}

export function formatBusinessCurrentDate(date: Date = new Date()): string {
	return formatCurrentDateInTimeZone(OPENMONETIS_TIME_ZONE, date);
}

// Re-export MONTH_NAMES for convenience
export { MONTH_NAMES };
