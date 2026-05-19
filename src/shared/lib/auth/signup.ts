/**
 * Checks if new user signup is disabled via DISABLE_SIGNUP env var.
 */
export function isSignupDisabled(): boolean {
	const value = process.env.DISABLE_SIGNUP?.toLowerCase();
	return value === "true";
}