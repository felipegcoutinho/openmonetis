"use client";

import {
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiCloseLine,
	RiDownloadLine,
	RiExternalLinkLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import type { AttachmentForPeriod } from "@/features/attachments/queries";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";

interface AttachmentPreviewProps {
	attachments: AttachmentForPeriod[];
	selectedIndex: number;
	onClose: () => void;
}

export function AttachmentPreview({
	attachments,
	selectedIndex,
	onClose,
}: AttachmentPreviewProps) {
	const [currentIndex, setCurrentIndex] = useState(selectedIndex);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const open = selectedIndex >= 0;

	useEffect(() => {
		if (selectedIndex >= 0) setCurrentIndex(selectedIndex);
	}, [selectedIndex]);

	useEffect(() => {
		if (!open) return;

		function handleKey(e: KeyboardEvent) {
			if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
			if (e.key === "ArrowRight")
				setCurrentIndex((i) => Math.min(attachments.length - 1, i + 1));
		}

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [open, attachments.length]);

	const attachment = attachments[currentIndex];
	const attachmentId = attachment?.attachmentId;

	// Busca URL fresca a cada troca de anexo
	useEffect(() => {
		if (!attachmentId) return;
		setPreviewUrl(null);

		fetch(`/api/attachments/${attachmentId}/presign`)
			.then((r) => r.json())
			.then((data: { url: string }) => setPreviewUrl(data.url))
			.catch(() => {});
	}, [attachmentId]);

	if (!attachment) return null;

	const isPdf = attachment.mimeType === "application/pdf";
	const isImage = attachment.mimeType.startsWith("image/");
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < attachments.length - 1;

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="flex h-[92vh] w-[min(96vw,1400px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:p-0"
			>
				<DialogHeader className="flex-row items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
					<div className="min-w-0 space-y-0.5">
						<DialogTitle
							className="truncate text-sm font-medium"
							title={attachment.transactionName}
						>
							{attachment.transactionName}
						</DialogTitle>
						<p
							className="truncate text-xs text-muted-foreground"
							title={attachment.fileName}
						>
							{attachment.fileName}
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-1">
						{attachments.length > 1 && (
							<>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={!hasPrev}
									onClick={() => setCurrentIndex((i) => i - 1)}
									title="Anterior (←)"
								>
									<RiArrowLeftSLine className="size-4" />
								</Button>
								<span className="select-none text-xs text-muted-foreground tabular-nums">
									{currentIndex + 1} / {attachments.length}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={!hasNext}
									onClick={() => setCurrentIndex((i) => i + 1)}
									title="Próximo (→)"
								>
									<RiArrowRightSLine className="size-4" />
								</Button>
							</>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={!previewUrl}
							asChild={!!previewUrl}
						>
							{previewUrl ? (
								<a
									href={previewUrl}
									target="_blank"
									rel="noreferrer"
									download={attachment.fileName}
								>
									<RiDownloadLine className="size-4" />
								</a>
							) : (
								<RiDownloadLine className="size-4" />
							)}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={!previewUrl}
							asChild={!!previewUrl}
						>
							{previewUrl ? (
								<a href={previewUrl} target="_blank" rel="noreferrer">
									<RiExternalLinkLine className="size-4" />
								</a>
							) : (
								<RiExternalLinkLine className="size-4" />
							)}
						</Button>
						<DialogClose asChild>
							<Button type="button" variant="ghost" size="icon">
								<RiCloseLine className="size-4" />
							</Button>
						</DialogClose>
					</div>
				</DialogHeader>

				<div className="min-h-0 min-w-0 flex-1">
					{!previewUrl && (
						<div className="flex h-full w-full items-center justify-center">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
						</div>
					)}
					{isPdf && previewUrl && (
						<iframe
							key={attachment.attachmentId}
							src={previewUrl}
							className="h-full w-full border-0 bg-background"
							title={attachment.fileName}
						/>
					)}
					{isImage && previewUrl && (
						<div className="flex h-full w-full items-center justify-center bg-black/85 p-4 sm:p-6">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								key={attachment.attachmentId}
								src={previewUrl}
								alt={attachment.fileName}
								className="max-h-full max-w-full rounded-md object-contain"
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
