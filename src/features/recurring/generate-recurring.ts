import { and, eq } from "drizzle-orm";
import { lancamentos, recurringSeries } from "@/db/schema";
import { db } from "@/shared/lib/db";
import {
	addMonthsToPeriod,
	comparePeriods,
	getCurrentPeriod,
	getNextPeriod,
	parsePeriod,
} from "@/shared/utils/period";

/**
 * Computes the purchase date for a given period and day of month.
 * Clamps to last day of month for short months (e.g., Feb 30 → Feb 28).
 */
function computePurchaseDate(period: string, dayOfMonth: number): Date {
	const { year, month } = parsePeriod(period);
	// month is 1-indexed, Date constructor expects 0-indexed
	const lastDayOfMonth = new Date(year, month, 0).getDate();
	const clampedDay = Math.min(dayOfMonth, lastDayOfMonth);
	return new Date(year, month - 1, clampedDay);
}

/**
 * Generates missing recurring transactions for a single user.
 *
 * For each active recurring series:
 * 1. Determines which months are missing between lastGeneratedPeriod and current month
 * 2. Creates lancamento rows for each missing month using the template data
 * 3. Updates lastGeneratedPeriod on the series
 *
 * Uses a DB transaction for atomicity.
 */
export async function generateRecurringTransactions(
	userId: string,
): Promise<{ generated: number }> {
	const currentPeriod = getCurrentPeriod();

	// Fetch all active recurring series for this user
	const activeSeries = await db
		.select()
		.from(recurringSeries)
		.where(
			and(
				eq(recurringSeries.userId, userId),
				eq(recurringSeries.status, "active"),
			),
		);

	if (activeSeries.length === 0) {
		return { generated: 0 };
	}

	let totalGenerated = 0;

	for (const series of activeSeries) {
		// Determine missing periods: from lastGeneratedPeriod + 1 to currentPeriod
		const startPeriod = getNextPeriod(series.lastGeneratedPeriod);

		// If startPeriod is already past the current period, nothing to generate
		if (comparePeriods(startPeriod, currentPeriod) > 0) {
			continue;
		}

		// Build list of periods to generate
		const periodsToGenerate: string[] = [];
		let iterPeriod = startPeriod;
		while (comparePeriods(iterPeriod, currentPeriod) <= 0) {
			periodsToGenerate.push(iterPeriod);
			iterPeriod = addMonthsToPeriod(iterPeriod, 1);
		}

		if (periodsToGenerate.length === 0) {
			continue;
		}

		const template = series.templateData;

		// Create all lancamentos for missing periods in a transaction
		await db.transaction(async (tx: typeof db) => {
			const records = periodsToGenerate.map((period) => {
				const purchaseDate = computePurchaseDate(period, series.dayOfMonth);
				return {
					name: template.name,
					amount: template.amount,
					transactionType: template.transactionType,
					paymentMethod: template.paymentMethod,
					condition: "Recorrente" as const,
					categoriaId: template.categoriaId,
					contaId: template.contaId,
					cartaoId: template.cartaoId,
					pagadorId: template.pagadorId,
					note: template.note,
					purchaseDate,
					period,
					isSettled: false,
					recurrenceCount: null,
					installmentCount: null,
					currentInstallment: null,
					isDivided: false,
					userId,
					seriesId: series.id,
					recurringSeriesId: series.id,
				};
			});

			await tx.insert(lancamentos).values(records);

			// Update lastGeneratedPeriod to the last period we generated
			const lastPeriod =
				periodsToGenerate[periodsToGenerate.length - 1] ??
				series.lastGeneratedPeriod;
			await tx
				.update(recurringSeries)
				.set({
					lastGeneratedPeriod: lastPeriod,
					updatedAt: new Date(),
				})
				.where(eq(recurringSeries.id, series.id));
		});

		totalGenerated += periodsToGenerate.length;
	}

	return { generated: totalGenerated };
}
