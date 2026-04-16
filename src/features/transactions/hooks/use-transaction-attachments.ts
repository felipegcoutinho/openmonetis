"use client";

import { useQuery } from "@tanstack/react-query";
import type { TransactionAttachmentListItem } from "@/features/transactions/attachment-queries";
import { fetchJson } from "@/shared/lib/fetch-json";

export const transactionAttachmentsQueryKey = (transactionId: string) =>
	["transactions", "attachments", transactionId] as const;

export function useTransactionAttachments(transactionId: string) {
	return useQuery({
		queryKey: transactionAttachmentsQueryKey(transactionId),
		queryFn: () =>
			fetchJson<TransactionAttachmentListItem[]>(
				`/api/transactions/${transactionId}/attachments`,
			),
		enabled: Boolean(transactionId),
		staleTime: 50 * 60 * 1000, // 50 min — presigned URLs duram 1h
		gcTime: 60 * 60 * 1000, // 1h — mantém cache enquanto URL é válida
	});
}
