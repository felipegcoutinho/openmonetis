"use client";

import { RiFileAddLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { fetchTransactionAttachmentsAction } from "@/features/transactions/actions/attachments";
import { Button } from "@/shared/components/ui/button";
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
	readonly?: boolean;
	onLoaded?: (count: number) => void;
	pendingDetachIds?: string[];
	onPendingDetach?: (attachmentId: string) => void;
	onUndoPendingDetach?: (attachmentId: string) => void;
	pendingUploadFiles?: File[];
	onPendingUpload?: (file: File) => void;
	onCancelPendingUpload?: (file: File) => void;
	maxSizeMb?: number;
}

export function AttachmentSection({
	transactionId,
	readonly = false,
	onLoaded,
	pendingDetachIds,
	onPendingDetach,
	onUndoPendingDetach,
	pendingUploadFiles,
	onPendingUpload,
	onCancelPendingUpload,
	maxSizeMb,
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

	if (isLoading) {
		return <p className="text-xs text-muted-foreground">Carregando...</p>;
	}

	const hasPendingUploads = (pendingUploadFiles?.length ?? 0) > 0;

	return (
		<div className="min-w-0 space-y-2 overflow-hidden">
			{items.length === 0 && !hasPendingUploads && readonly && (
				<p className="text-xs text-muted-foreground">Nenhum anexo.</p>
			)}

			{(items.length > 0 || hasPendingUploads) && (
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
							isPendingDelete={pendingDetachIds?.includes(item.attachmentId)}
							onPendingDelete={onPendingDetach}
							onUndoPendingDelete={onUndoPendingDetach}
						/>
					))}

					{pendingUploadFiles?.map((file) => (
						<div
							key={`${file.name}-${file.size}`}
							className="flex min-w-0 items-center gap-2 overflow-hidden rounded-md border border-dashed px-3 py-2 text-sm opacity-60"
						>
							<RiFileAddLine className="size-4 shrink-0 text-muted-foreground" />
							<div className="flex-1 min-w-0">
								<p className="truncate font-medium">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									Será adicionado ao salvar
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="shrink-0 text-xs h-7 px-2"
								onClick={() => onCancelPendingUpload?.(file)}
							>
								Cancelar
							</Button>
						</div>
					))}
				</div>
			)}

			{!readonly && (
				<AttachmentUpload
					transactionId={transactionId}
					onUploaded={load}
					onPendingUpload={onPendingUpload}
					maxSizeMb={maxSizeMb}
				/>
			)}
		</div>
	);
}
