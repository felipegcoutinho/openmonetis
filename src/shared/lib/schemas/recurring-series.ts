import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * Schema for pause/resume/cancel recurring series actions
 */
export const recurringSeriesActionSchema = z.object({
	seriesId: uuidSchema("Série recorrente"),
});

export type RecurringSeriesActionInput = z.infer<
	typeof recurringSeriesActionSchema
>;
