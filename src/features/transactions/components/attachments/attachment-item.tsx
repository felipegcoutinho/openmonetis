"use client";

import {
	RiDeleteBinLine,
	RiDownloadLine,
	RiExternalLinkLine,
	RiFileImageLine,
	RiFilePdf2Line,
} from "@remixicon/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { detachTransactionAttachmentAction } from "@/features/transactions/actions/attachments";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
	if (mimeType === "application/pdf")
		return <RiFilePdf2Line className="size-4 text-red-500 shrink-0" />;
	if (mimeType.startsWith("image/"))
		return <RiFileImageLine className="size-4 text-blue-500 shrink-0" />;
}

function AttachmentPreview({
	open,
	onOpenChange,
	fileName,
	mimeType,
	url,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fileName: string;
	mimeType: string;
	url: string;
}) {
	const isPdf = mimeType === "application/pdf";
	const isImage = mimeType.startsWith("image/");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="flex h-[92vh] w-[min(96vw,1400px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:p-0"
			>
				<DialogHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
					<div className="min-w-0">
						<DialogTitle
							className="truncate text-sm font-medium"
							title={fileName}
						>
							{fileName}
						</DialogTitle>
					</div>

					<div className="flex shrink-0 items-center gap-1">
						<Button type="button" variant="ghost" size="icon" asChild>
							<a
								href={url}
								target="_blank"
								rel="noreferrer"
								download={fileName}
							>
								<RiDownloadLine className="size-4" />
							</a>
						</Button>
						<Button type="button" variant="ghost" size="icon" asChild>
							<a href={url} target="_blank" rel="noreferrer">
								<RiExternalLinkLine className="size-4" />
							</a>
						</Button>
						<DialogClose asChild>
							<Button type="button" variant="ghost" size="sm">
								Fechar
							</Button>
						</DialogClose>
					</div>
				</DialogHeader>

				<div className="min-h-0 min-w-0 flex-1">
					{isPdf && (
						<iframe
							src={url}
							className="h-full w-full border-0 bg-background"
							title={fileName}
						/>
					)}
					{isImage && (
						<div className="flex h-full w-full items-center justify-center bg-black/85 p-4 sm:p-6">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={url}
								alt={fileName}
								className="max-h-full max-w-full rounded-md object-contain"
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface AttachmentItemProps {
	attachmentId: string;
	transactionId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	url: string;
	onDeleted: () => void;
	readonly?: boolean;
	isPendingDelete?: boolean;
	onPendingDelete?: (attachmentId: string) => void;
	onUndoPendingDelete?: (attachmentId: string) => void;
}

export function AttachmentItem({
	attachmentId,
	transactionId,
	fileName,
	fileSize,
	mimeType,
	url,
	onDeleted,
	readonly = false,
	isPendingDelete = false,
	onPendingDelete,
	onUndoPendingDelete,
}: AttachmentItemProps) {
	const [isPending, startTransition] = useTransition();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const canPreview =
		mimeType === "application/pdf" || mimeType.startsWith("image/");

	function handleDelete() {
		if (onPendingDelete) {
			onPendingDelete(attachmentId);
			setConfirmOpen(false);
			return;
		}
		startTransition(async () => {
			const result = await detachTransactionAttachmentAction({
				attachmentId,
				transactionId,
			});
			if (result.success) {
				toast.success(result.message);
				onDeleted();
			} else {
				toast.error(result.error);
			}
		});
		setConfirmOpen(false);
	}

	return (
		<>
			<div
				className={`flex min-w-0 items-center gap-2 overflow-hidden rounded-md border px-3 py-2 text-sm transition-opacity ${isPendingDelete ? "opacity-50 border-dashed" : ""}`}
			>
				<AttachmentIcon mimeType={mimeType} />
				{isPendingDelete ? (
					<div className="flex-1 min-w-0">
						<p className="truncate font-medium line-through">{fileName}</p>
						<p className="text-xs text-muted-foreground">
							Será removido ao salvar
						</p>
					</div>
				) : canPreview ? (
					<button
						type="button"
						className="min-w-0 flex-1 text-left"
						onClick={() => setPreviewOpen(true)}
						title={fileName}
					>
						<p className="truncate font-medium hover:underline">{fileName}</p>
						<p className="text-xs text-muted-foreground">
							{formatBytes(fileSize)}
						</p>
					</button>
				) : (
					<div className="flex-1 min-w-0">
						<p className="truncate font-medium">{fileName}</p>
						<p className="text-xs text-muted-foreground">
							{formatBytes(fileSize)}
						</p>
					</div>
				)}
				{!isPendingDelete && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 shrink-0"
						asChild
					>
						<a href={url} target="_blank" rel="noreferrer" download={fileName}>
							<RiDownloadLine className="size-4" />
						</a>
					</Button>
				)}
				{!readonly &&
					(isPendingDelete ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="shrink-0 text-xs h-7 px-2"
							onClick={() => onUndoPendingDelete?.(attachmentId)}
						>
							Desfazer
						</Button>
					) : (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-7 shrink-0 text-destructive hover:text-destructive"
							onClick={() => setConfirmOpen(true)}
							disabled={isPending}
						>
							<RiDeleteBinLine className="size-4" />
						</Button>
					))}
			</div>

			{canPreview && (
				<AttachmentPreview
					open={previewOpen}
					onOpenChange={setPreviewOpen}
					fileName={fileName}
					mimeType={mimeType}
					url={url}
				/>
			)}

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Remover anexo</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja remover{" "}
							<span className="break-all font-medium text-foreground">
								{fileName}
							</span>
							?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={isPending}>
								Cancelar
							</Button>
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isPending}
						>
							{isPending ? "Removendo..." : "Remover"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
