"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTransactionAttachmentsAction } from "@/features/transactions/actions/attachments";
import { AttachmentItem } from "./attachment-item";
import { AttachmentUpload } from "./attachment-upload";

type AttachmentRow = {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	createdAt: Date;
	url: string;
};

interface AttachmentSectionProps {
	transactionId: string;
	seriesId: string | null;
	readonly?: boolean;
	onLoaded?: (count: number) => void;
}

export function AttachmentSection({
	transactionId,
	seriesId,
	readonly = false,
	onLoaded,
}: AttachmentSectionProps) {
	const [items, setItems] = useState<AttachmentRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await fetchTransactionAttachmentsAction(transactionId);
			setItems(data);
			onLoaded?.(data.length);
		} finally {
			setIsLoading(false);
		}
	}, [transactionId, onLoaded]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div className="min-w-0 space-y-2 overflow-hidden">
			{isLoading ? (
				<p className="text-xs text-muted-foreground">Carregando...</p>
			) : (
				<>
					{items.length > 0 ? (
						<div className="min-w-0 space-y-1.5">
							{items.map((item) => (
								<AttachmentItem
									key={item.attachmentId}
									attachmentId={item.attachmentId}
									transactionId={transactionId}
									fileName={item.fileName}
									fileSize={item.fileSize}
									mimeType={item.mimeType}
									url={item.url}
									onDeleted={load}
									readonly={readonly}
								/>
							))}
						</div>
					) : (
						readonly && (
							<p className="text-xs text-muted-foreground">Nenhum anexo.</p>
						)
					)}

					{!readonly && (
						<AttachmentUpload
							transactionId={transactionId}
							seriesId={seriesId}
							onUploaded={load}
						/>
					)}
				</>
			)}
		</div>
	);
}
