/**
 * Utility functions for safe number conversions and formatting
 */

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Safely converts unknown value to number
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Converted number or default value
 */
export function safeToNumber(value: unknown, defaultValue: number = 0): number {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? defaultValue : parsed;
	}

	if (value === null || value === undefined) {
		return defaultValue;
	}

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}
