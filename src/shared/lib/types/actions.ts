/**
 * Standard action result type
 */
export type ActionResult<TData = void> =
	| { success: true; message: string; data?: TData }
	| { success: false; error: string };

/**
 * Error result helper
 */
export function errorResult(error: string): ActionResult {
	return { success: false, error };
}
