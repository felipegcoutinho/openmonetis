"use server";

import { and, eq } from "drizzle-orm";
import { recurringSeries } from "@/db/schema";
import { generateRecurringTransactions } from "@/features/recurring/generate-recurring";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { recurringSeriesActionSchema } from "@/shared/lib/schemas/recurring-series";
import type { ActionResult } from "@/shared/lib/types/actions";

const revalidate = () => revalidateForEntity("recorrentes");

async function findRecurringSeriesForUser(userId: string, seriesId: string) {
	const [series] = await db
		.select({
			id: recurringSeries.id,
			status: recurringSeries.status,
		})
		.from(recurringSeries)
		.where(
			and(eq(recurringSeries.id, seriesId), eq(recurringSeries.userId, userId)),
		)
		.limit(1);

	return series ?? null;
}

export async function pauseRecurringSeriesAction(input: {
	seriesId: string;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = recurringSeriesActionSchema.parse(input);

		const existing = await findRecurringSeriesForUser(user.id, data.seriesId);

		if (!existing) {
			return { success: false, error: "Série recorrente não encontrada." };
		}

		if (existing.status !== "active") {
			return {
				success: false,
				error: "Apenas séries ativas podem ser pausadas.",
			};
		}

		await db
			.update(recurringSeries)
			.set({ status: "paused", updatedAt: new Date() })
			.where(
				and(
					eq(recurringSeries.id, data.seriesId),
					eq(recurringSeries.userId, user.id),
				),
			);

		revalidate();
		return { success: true, message: "Série recorrente pausada." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function resumeRecurringSeriesAction(input: {
	seriesId: string;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = recurringSeriesActionSchema.parse(input);

		const existing = await findRecurringSeriesForUser(user.id, data.seriesId);

		if (!existing) {
			return { success: false, error: "Série recorrente não encontrada." };
		}

		if (existing.status !== "paused") {
			return {
				success: false,
				error: "Apenas séries pausadas podem ser retomadas.",
			};
		}

		await db
			.update(recurringSeries)
			.set({ status: "active", updatedAt: new Date() })
			.where(
				and(
					eq(recurringSeries.id, data.seriesId),
					eq(recurringSeries.userId, user.id),
				),
			);

		// Trigger catch-up generation for missed months
		await generateRecurringTransactions(user.id);

		revalidate();
		return { success: true, message: "Série recorrente retomada." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function cancelRecurringSeriesAction(input: {
	seriesId: string;
}): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = recurringSeriesActionSchema.parse(input);

		const existing = await findRecurringSeriesForUser(user.id, data.seriesId);

		if (!existing) {
			return { success: false, error: "Série recorrente não encontrada." };
		}

		if (existing.status === "cancelled") {
			return {
				success: false,
				error: "Esta série já está cancelada.",
			};
		}

		await db
			.update(recurringSeries)
			.set({ status: "cancelled", updatedAt: new Date() })
			.where(
				and(
					eq(recurringSeries.id, data.seriesId),
					eq(recurringSeries.userId, user.id),
				),
			);

		revalidate();
		return { success: true, message: "Série recorrente cancelada." };
	} catch (error) {
		return handleActionError(error);
	}
}
