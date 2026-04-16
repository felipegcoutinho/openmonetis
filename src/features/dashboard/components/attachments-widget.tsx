"use client";

import {
	RiAttachmentLine,
	RiFileLine,
	RiFilePdf2Line,
	RiImageLine,
} from "@remixicon/react";
import { useState } from "react";
import { AttachmentPreview } from "@/features/attachments/components/attachment-preview";
import type { AttachmentForPeriod } from "@/features/attachments/queries";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { formatDateOnly } from "@/shared/utils/date";
import { formatBytes } from "@/shared/utils/number";

type AttachmentsSnapshot = {
	totalCount: number;
	totalBytes: number;
	imageCount: number;
	pdfCount: number;
	recentAttachments: AttachmentForPeriod[];
};

type AttachmentsWidgetProps = {
	snapshot: AttachmentsSnapshot;
};

export function AttachmentsWidget({ snapshot }: AttachmentsWidgetProps) {
	const [selectedIndex, setSelectedIndex] = useState(-1);

	if (snapshot.totalCount === 0) {
		return (
			<WidgetEmptyState
				icon={<RiAttachmentLine className="size-6 text-muted-foreground" />}
				title="Nenhum anexo no período"
				description="Adicione comprovantes nos seus lançamentos para vê-los aqui."
			/>
		);
	}

	return (
		<>
			<div className="mb-2 flex flex-wrap gap-2">
				<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
					<RiAttachmentLine className="size-3.5" />
					{snapshot.totalCount} {snapshot.totalCount === 1 ? "anexo" : "anexos"}
				</span>
				<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
					{formatBytes(snapshot.totalBytes)}
				</span>
				{snapshot.imageCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
						<RiImageLine className="size-3.5 text-blue-500" />
						{snapshot.imageCount}
					</span>
				)}
				{snapshot.pdfCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
						<RiFilePdf2Line className="size-3.5 text-red-500" />
						{snapshot.pdfCount}
					</span>
				)}
			</div>

			<ul className="flex flex-col">
				{snapshot.recentAttachments.map((attachment, index) => {
					const isPdf = attachment.mimeType === "application/pdf";
					const isImage = attachment.mimeType.startsWith("image/");

					return (
						<li key={`${attachment.attachmentId}-${attachment.transactionId}`}>
							<button
								type="button"
								onClick={() => setSelectedIndex(index)}
								className="flex w-full items-center gap-2 py-2 text-left"
							>
								<div className="shrink-0">
									{isPdf && <RiFilePdf2Line className="size-6 text-red-500" />}
									{isImage && <RiImageLine className="size-6 text-blue-500" />}
									{!isPdf && !isImage && (
										<RiFileLine className="size-6 text-muted-foreground" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="block truncate text-sm font-medium text-foreground hover:underline">
												{attachment.fileName}
											</span>
										</TooltipTrigger>
										<TooltipContent side="top" className="max-w-xs break-all">
											{attachment.fileName}
										</TooltipContent>
									</Tooltip>
									<span className="block truncate text-xs text-muted-foreground">
										{attachment.transactionName}
									</span>
								</div>
								<div className="shrink-0 text-right">
									<span className="block text-xs text-muted-foreground">
										{formatDateOnly(attachment.purchaseDate, {
											day: "2-digit",
											month: "2-digit",
										}) ?? "—"}
									</span>
									<span className="block text-xs text-muted-foreground/60">
										{formatBytes(attachment.fileSize)}
									</span>
								</div>
							</button>
						</li>
					);
				})}
			</ul>

			<AttachmentPreview
				attachments={snapshot.recentAttachments}
				selectedIndex={selectedIndex}
				onClose={() => setSelectedIndex(-1)}
			/>
		</>
	);
}
