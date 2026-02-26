/**
 * Utility functions for mathematical calculations
 */

/**
 * Calculates percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change or null if previous is 0 and current is also 0
 */
export function calculatePercentageChange(
	current: number,
	previous: number,
): number | null {
	const EPSILON = 0.01; // Considera valores menores que 1 centavo como zero

	if (Math.abs(previous) < EPSILON) {
		if (Math.abs(current) < EPSILON) return null;
		return current > 0 ? 100 : -100;
	}

	const change = ((current - previous) / Math.abs(previous)) * 100;

	// Protege contra valores absurdos (retorna null se > 1 milhão %)
	return Number.isFinite(change) && Math.abs(change) < 1000000 ? change : null;
}
