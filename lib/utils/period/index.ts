/**
 * Period utilities - Consolidated module for period (YYYY-MM) manipulation
 *
 * This module consolidates period-related functionality from:
 * - /lib/month-period.ts (URL param handling)
 * - /lib/period/index.ts (YYYY-MM operations)
 * - /hooks/use-dates.ts (month navigation)
 * - /lib/lancamentos/period-helpers.ts (formatting)
 *
 * Moved from /lib/period to /lib/utils/period for better organization
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const MONTH_NAMES = [
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

export type MonthName = (typeof MONTH_NAMES)[number];

// ============================================================================
// CORE PARSING & FORMATTING (YYYY-MM format)
// ============================================================================

/**
 * Parses period string into year and month
 * @param period - Period string in YYYY-MM format
 * @returns Object with year and month numbers
 * @throws Error if period format is invalid
 */
export function parsePeriod(period: string): { year: number; month: number } {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Período inválido: ${period}`);
  }

  return { year, month };
}

/**
 * Formats year and month into period string
 * @param year - Year number
 * @param month - Month number (1-12)
 * @returns Period string in YYYY-MM format
 */
export function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Validates if period string is valid
 * @param period - Period string to validate
 * @returns True if valid, false otherwise
 */
export function isPeriodValid(period: string): boolean {
  try {
    parsePeriod(period);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// PERIOD NAVIGATION
// ============================================================================

/**
 * Returns the current period in YYYY-MM format
 * @example
 * getCurrentPeriod() // "2025-11"
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  return formatPeriod(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Gets the previous period
 * @param period - Current period in YYYY-MM format
 * @returns Previous period string
 */
export function getPreviousPeriod(period: string): string {
  const { year, month } = parsePeriod(period);

  if (month === 1) {
    return formatPeriod(year - 1, 12);
  }

  return formatPeriod(year, month - 1);
}

/**
 * Gets the next period
 * @param period - Current period in YYYY-MM format
 * @returns Next period string
 */
export function getNextPeriod(period: string): string {
  const { year, month } = parsePeriod(period);

  if (month === 12) {
    return formatPeriod(year + 1, 1);
  }

  return formatPeriod(year, month + 1);
}

/**
 * Adds months to a period
 * @param period - Period string in YYYY-MM format
 * @param offset - Number of months to add (can be negative)
 * @returns New period string
 */
export function addMonthsToPeriod(period: string, offset: number): string {
  const { year: baseYear, month: baseMonth } = parsePeriod(period);

  const date = new Date(baseYear, baseMonth - 1, 1);
  date.setMonth(date.getMonth() + offset);

  const nextYear = date.getFullYear();
  const nextMonth = date.getMonth() + 1;

  return formatPeriod(nextYear, nextMonth);
}

/**
 * Gets the last N periods including the current one
 * @param current - Current period in YYYY-MM format
 * @param length - Number of periods to return
 * @returns Array of period strings
 */
export function getLastPeriods(current: string, length: number): string[] {
  const periods: string[] = [];

  for (let offset = length - 1; offset >= 0; offset -= 1) {
    periods.push(addMonthsToPeriod(current, -offset));
  }

  return periods;
}

// ============================================================================
// PERIOD COMPARISON & RANGES
// ============================================================================

/**
 * Compares two periods
 * @param a - First period
 * @param b - Second period
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function comparePeriods(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Builds a range of periods between start and end (inclusive)
 * @param start - Start period
 * @param end - End period
 * @returns Array of period strings
 */
export function buildPeriodRange(start: string, end: string): string[] {
  const [startKey, endKey] =
    comparePeriods(start, end) <= 0 ? [start, end] : [end, start];

  const startParts = parsePeriod(startKey);
  const endParts = parsePeriod(endKey);

  const items: string[] = [];
  let currentYear = startParts.year;
  let currentMonth = startParts.month;

  while (
    currentYear < endParts.year ||
    (currentYear === endParts.year && currentMonth <= endParts.month)
  ) {
    items.push(formatPeriod(currentYear, currentMonth));

    if (currentYear === endParts.year && currentMonth === endParts.month) {
      break;
    }

    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  return items;
}

// ============================================================================
// URL PARAM HANDLING (mes-ano format for Portuguese URLs)
// ============================================================================

const MONTH_MAP = new Map(MONTH_NAMES.map((name, index) => [name, index]));

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

export type ParsedPeriod = {
  period: string;
  monthName: string;
  year: number;
};

/**
 * Parses URL param in "mes-ano" format (e.g., "novembro-2025")
 * @param periodParam - URL parameter string
 * @param referenceDate - Fallback date if param is invalid
 * @returns Parsed period object
 */
export function parsePeriodParam(
  periodParam: string | null | undefined,
  referenceDate = new Date()
): ParsedPeriod {
  const fallbackMonthIndex = referenceDate.getMonth();
  const fallbackYear = referenceDate.getFullYear();
  const fallbackPeriod = formatPeriod(fallbackYear, fallbackMonthIndex + 1);

  if (!periodParam) {
    const monthName = MONTH_NAMES[fallbackMonthIndex];
    return { period: fallbackPeriod, monthName, year: fallbackYear };
  }

  const [rawMonth, rawYear] = periodParam.split("-");
  const normalizedMonth = normalize(rawMonth);
  const monthIndex = MONTH_MAP.get(normalizedMonth);
  const parsedYear = Number.parseInt(rawYear ?? "", 10);

  if (monthIndex === undefined || Number.isNaN(parsedYear)) {
    const monthName = MONTH_NAMES[fallbackMonthIndex];
    return { period: fallbackPeriod, monthName, year: fallbackYear };
  }

  const monthName = MONTH_NAMES[monthIndex];
  return {
    period: formatPeriod(parsedYear, monthIndex + 1),
    monthName,
    year: parsedYear,
  };
}

/**
 * Formats month name and year to URL param format
 * @param monthName - Month name in Portuguese
 * @param year - Year number
 * @returns URL param string in "mes-ano" format
 */
export function formatPeriodParam(monthName: string, year: number): string {
  return `${normalize(monthName)}-${year}`;
}

/**
 * Converts period from YYYY-MM format to URL param format
 * @example
 * formatPeriodForUrl("2025-11") // "novembro-2025"
 * formatPeriodForUrl("2025-01") // "janeiro-2025"
 */
export function formatPeriodForUrl(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const monthIndex = Number.parseInt(monthStr ?? "", 10) - 1;

  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return period;
  }

  const monthName = MONTH_NAMES[monthIndex] ?? "";
  return formatPeriodParam(monthName, year);
}

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

function capitalize(value: string): string {
  return value.length > 0
    ? value[0]?.toUpperCase().concat(value.slice(1))
    : value;
}

/**
 * Formats period for display in Portuguese
 * @example
 * displayPeriod("2025-11") // "Novembro de 2025"
 */
export function displayPeriod(period: string): string {
  const { year, month } = parsePeriod(period);
  const monthName = MONTH_NAMES[month - 1] ?? "";
  return `${capitalize(monthName)} de ${year}`;
}

/**
 * Alias for displayPeriod - formats period for display
 * @example
 * formatMonthLabel("2024-01") // "Janeiro de 2024"
 */
export function formatMonthLabel(period: string): string {
  return displayPeriod(period);
}

// ============================================================================
// DATE DERIVATION
// ============================================================================

/**
 * Derives a period (YYYY-MM) from a date string or current date
 * @example
 * derivePeriodFromDate("2024-01-15") // "2024-01"
 * derivePeriodFromDate() // current period
 */
export function derivePeriodFromDate(value?: string | null): string {
  if (!value) {
    return getCurrentPeriod();
  }

  // Parse date string as local date to avoid timezone issues
  // IMPORTANT: new Date("2025-11-25") treats the date as UTC midnight,
  // which in Brazil (UTC-3) becomes 2025-11-26 03:00 local time!
  const [year, month, day] = value.split("-");
  const date = new Date(
    Number.parseInt(year ?? "0", 10),
    Number.parseInt(month ?? "1", 10) - 1,
    Number.parseInt(day ?? "1", 10)
  );

  if (Number.isNaN(date.getTime())) {
    return getCurrentPeriod();
  }

  return formatPeriod(date.getFullYear(), date.getMonth() + 1);
}

