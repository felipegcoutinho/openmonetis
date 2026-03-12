import type { DateRangeValidation } from "@/shared/lib/types/reports";
import { calculatePercentageChange } from "@/shared/utils/math";
import { formatPercentageChange as formatPercentageChangeValue } from "@/shared/utils/percentage";
import {
	buildPeriodRange,
	formatShortPeriodLabel,
	parsePeriod,
} from "@/shared/utils/period";

// Re-export for convenience
export { calculatePercentageChange };

/**
 * Formats period string from "YYYY-MM" to "MMM/YYYY" format
 * Example: "2025-01" -> "Jan/2025"
 *
 * @param period - Period in YYYY-MM format
 * @returns Formatted period string
 */
export function formatPeriodLabel(period: string): string {
	try {
		parsePeriod(period);
		return formatShortPeriodLabel(period);
	} catch {
		return period; // Return original if parsing fails
	}
}

/**
 * Generates an array of periods between start and end (inclusive)
 * Alias for buildPeriodRange from period utils
 *
 * @param startPeriod - Start period in YYYY-MM format
 * @param endPeriod - End period in YYYY-MM format
 * @returns Array of period strings in chronological order
 */
export function generatePeriodRange(
	startPeriod: string,
	endPeriod: string,
): string[] {
	return buildPeriodRange(startPeriod, endPeriod);
}

/**
 * Validates that end date is >= start date and period is within limits
 * Maximum allowed period: 24 months
 *
 * @param startPeriod - Start period in YYYY-MM format
 * @param endPeriod - End period in YYYY-MM format
 * @returns Validation result with error message if invalid
 */
export function validateDateRange(
	startPeriod: string,
	endPeriod: string,
): DateRangeValidation {
	try {
		// Parse periods to validate format
		const start = parsePeriod(startPeriod);
		const end = parsePeriod(endPeriod);

		// Check if end is before start
		if (
			end.year < start.year ||
			(end.year === start.year && end.month < start.month)
		) {
			return {
				isValid: false,
				error: "A data final deve ser maior ou igual à data inicial",
			};
		}

		// Calculate number of months between periods
		const monthsDiff =
			(end.year - start.year) * 12 + (end.month - start.month) + 1;

		// Check if period exceeds 24 months
		if (monthsDiff > 24) {
			return {
				isValid: false,
				error: "O período máximo permitido é de 24 meses",
			};
		}

		return { isValid: true };
	} catch (error) {
		return {
			isValid: false,
			error:
				error instanceof Error
					? error.message
					: "Formato de período inválido. Use YYYY-MM",
		};
	}
}

/**
 * Formats percentage change for display
 * Format: "±X%" or "±X.X%" (one decimal if < 10%)
 *
 * @param change - Percentage change value
 * @returns Formatted percentage string
 */
export function formatPercentageChange(change: number | null): string {
	return formatPercentageChangeValue(change);
}
