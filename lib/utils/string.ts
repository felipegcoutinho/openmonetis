/**
 * Utility functions for string normalization and manipulation
 */

/**
 * Normalizes optional string - trims and returns null if empty
 * @param value - String to normalize
 * @returns Trimmed string or null if empty
 */
export function normalizeOptionalString(
	value: string | null | undefined,
): string | null {
	const trimmed = value?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalizes file path by extracting filename
 * @param path - File path to normalize
 * @returns Filename without path
 */
export function normalizeFilePath(path: string | null | undefined): string {
	return path?.split("/").filter(Boolean).pop() ?? "";
}

/**
 * Normalizes icon input - trims and returns null if empty
 * @param icon - Icon string to normalize
 * @returns Trimmed icon string or null
 */
export function normalizeIconInput(icon?: string | null): string | null {
	const trimmed = icon?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : null;
}
