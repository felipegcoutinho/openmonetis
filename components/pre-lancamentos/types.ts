import type { SelectOption as LancamentoSelectOption } from "@/components/lancamentos/types";

export interface InboxItem {
	id: string;
	sourceApp: string;
	sourceAppName: string | null;
	originalTitle: string | null;
	originalText: string;
	notificationTimestamp: Date;
	parsedName: string | null;
	parsedAmount: string | null;
	status: string;
	lancamentoId: string | null;
	processedAt: Date | null;
	discardedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// Re-export the lancamentos SelectOption for use in inbox components
export type SelectOption = LancamentoSelectOption;
