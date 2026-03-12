import { z } from "zod";

export const inboxItemSchema = z.object({
	sourceApp: z.string().min(1, "sourceApp é obrigatório"),
	sourceAppName: z.string().optional(),
	originalTitle: z.string().optional(),
	originalText: z.string().min(1, "originalText é obrigatório"),
	notificationTimestamp: z.string().transform((val) => new Date(val)),
	parsedName: z.string().optional(),
	parsedAmount: z.coerce.number().optional(),
	clientId: z.string().optional(), // ID local do app para rastreamento
});

export const inboxBatchSchema = z.object({
	items: z.array(inboxItemSchema).min(1).max(50),
});
