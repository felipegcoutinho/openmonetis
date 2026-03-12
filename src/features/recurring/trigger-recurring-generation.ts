import { cache } from "react";
import { generateRecurringTransactions } from "./generate-recurring";

/**
 * Triggers recurring transaction generation for a user.
 * Deduped per-request via React.cache to avoid multiple calls
 * during the same server render (layout + page).
 *
 * Call this at the top of dashboard and lancamentos page server components.
 */
export const triggerRecurringGeneration = cache(
	async (userId: string): Promise<void> => {
		try {
			await generateRecurringTransactions(userId);
		} catch (error) {
			// Log but don't throw — generation failure should not block page render
			console.error(
				"[RecurringGeneration] Failed to generate recurring transactions:",
				error,
			);
		}
	},
);
