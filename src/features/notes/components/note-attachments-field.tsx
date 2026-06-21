"use client";

import {
	RiAttachment2,
	RiCloseLine,
	RiDeleteBinLine,
	RiDownloadLine,
	RiFileImageLine,
	RiFilePdf2Line,
} from "@remixicon/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	confirmNoteAttachmentUploadAction,
	getPresignedNoteAttachmentUploadUrlAction,
	removeNoteAttachmentAction,
} from "@/features/notes/actions/attachments";
import type { NoteAttachment } from "@/features/notes/components/types";
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
import {
	ALLOWED_MIME_TYPES,
	DEFAULT_MAX_FILE_SIZE_MB,
} from "@/shared/lib/attachments/config";

type UploadResult =
	| { success: true; attachment: NoteAttachment }
	| { success: false; error: string };

export async function uploadNoteAttachment(
	noteId: string,
	file: File,
): Promise<UploadResult> {
	try {
		const presign = await getPresignedNoteAttachmentUploadUrlAction({
			noteId,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
		});
		if (!presign.success) return presign;

		const uploaded = await fetch(presign.presignedUrl, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type },
		});
		if (!uploaded.ok) {
			return { success: false, error: "Não foi possível enviar o arquivo." };
		}

		const confirmed = await confirmNoteAttachmentUploadAction({
			uploadToken: presign.uploadToken,
		});
		if (!confirmed.success || !confirmed.data) {
			return {
				success: false,
				error: confirmed.success
					? "Não foi possível salvar o anexo."
					: confirmed.error,
			};
		}
		return { success: true, attachment: confirmed.data };
	} catch {
		return {
			success: false,
			error: "Não foi possível enviar o arquivo agora.",
		};
	}
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File, maxSizeMb: number): string | null {
	if (
		!ALLOWED_MIME_TYPES.includes(
			file.type as (typeof ALLOWED_MIME_TYPES)[number],
		)
	) {
		return "Tipo não suportado. Use PDF, JPEG, PNG ou WebP.";
	}
	if (file.size > maxSizeMb * 1024 * 1024) {
		return `O arquivo deve ter no máximo ${maxSizeMb}MB.`;
	}
	return null;
}

interface NoteAttachmentsFieldProps {
	noteId?: string;
	attachments: NoteAttachment[];
	pendingFiles: File[];
	onAttachmentsChange: (attachments: NoteAttachment[]) => void;
	onPendingFilesChange: (files: File[]) => void;
	onBusyChange?: (busy: boolean) => void;
	maxSizeMb?: number;
	disabled?: boolean;
	readonly?: boolean;
}

export function NoteAttachmentsField({
	noteId,
	attachments,
	pendingFiles,
	onAttachmentsChange,
	onPendingFilesChange,
	onBusyChange,
	maxSizeMb = DEFAULT_MAX_FILE_SIZE_MB,
	disabled = false,
	readonly = false,
}: NoteAttachmentsFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [removing, setRemoving] = useState<NoteAttachment | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const [openingId, setOpeningId] = useState<string | null>(null);

	async function addFiles(files: File[]) {
		const valid: File[] = [];
		for (const file of files) {
			const error = validateFile(file, maxSizeMb);
			if (error) toast.error(`${file.name}: ${error}`);
			else valid.push(file);
		}
		if (valid.length === 0) return;

		if (!noteId) {
			onPendingFilesChange([...pendingFiles, ...valid]);
			return;
		}

		setUploading(true);
		onBusyChange?.(true);
		const added: NoteAttachment[] = [];
		for (const file of valid) {
			const result = await uploadNoteAttachment(noteId, file);
			if (result.success) added.push(result.attachment);
			else toast.error(`${file.name}: ${result.error}`);
		}
		setUploading(false);
		onBusyChange?.(false);
		if (added.length > 0) {
			onAttachmentsChange([...attachments, ...added]);
			toast.success(
				added.length === 1
					? "Anexo enviado."
					: `${added.length} anexos enviados.`,
			);
		}
	}

	async function downloadAttachment(attachment: NoteAttachment) {
		setOpeningId(attachment.attachmentId);
		try {
			const response = await fetch(
				`/api/attachments/${attachment.attachmentId}/presign`,
			);
			if (!response.ok) throw new Error();
			const { url } = (await response.json()) as { url: string };
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = attachment.fileName;
			anchor.target = "_blank";
			anchor.rel = "noreferrer";
			anchor.click();
		} catch {
			toast.error("Não foi possível baixar o anexo agora.");
		} finally {
			setOpeningId(null);
		}
	}

	async function confirmRemove() {
		if (!noteId || !removing) return;
		setIsRemoving(true);
		onBusyChange?.(true);
		const result = await removeNoteAttachmentAction({
			noteId,
			attachmentId: removing.attachmentId,
		});
		setIsRemoving(false);
		onBusyChange?.(false);
		if (result.success) {
			onAttachmentsChange(
				attachments.filter(
					(item) => item.attachmentId !== removing.attachmentId,
				),
			);
			setRemoving(null);
			toast.success(result.message);
		} else {
			toast.error(result.error);
		}
	}

	return (
		<div className="space-y-1.5">
			<p className="text-xs font-medium">Anexos</p>
			<input
				ref={inputRef}
				type="file"
				multiple
				className="hidden"
				accept={ALLOWED_MIME_TYPES.join(",")}
				onChange={(event) => {
					void addFiles(Array.from(event.target.files ?? []));
					event.target.value = "";
				}}
			/>

			{attachments.length > 0 && (
				<div className="space-y-1.5">
					{attachments.map((attachment) => (
						<div
							key={attachment.attachmentId}
							className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-sm"
						>
							{attachment.mimeType === "application/pdf" ? (
								<RiFilePdf2Line className="size-4 shrink-0 text-red-500" />
							) : (
								<RiFileImageLine className="size-4 shrink-0 text-blue-500" />
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium" title={attachment.fileName}>
									{attachment.fileName}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatBytes(attachment.fileSize)}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-7 shrink-0"
								disabled={openingId === attachment.attachmentId}
								onClick={() => void downloadAttachment(attachment)}
								aria-label={`Baixar ${attachment.fileName}`}
							>
								<RiDownloadLine className="size-4" />
							</Button>
							{!readonly && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-7 shrink-0 text-destructive hover:text-destructive"
									disabled={disabled}
									onClick={() => setRemoving(attachment)}
									aria-label={`Remover ${attachment.fileName}`}
								>
									<RiDeleteBinLine className="size-4" />
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			{pendingFiles.map((file, index) => (
				<div
					key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
					className="flex min-w-0 items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm"
				>
					<RiAttachment2 className="size-4 shrink-0 text-muted-foreground" />
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium">{file.name}</p>
						<p className="text-xs text-muted-foreground">
							Será enviado ao salvar
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 shrink-0"
						onClick={() =>
							onPendingFilesChange(
								pendingFiles.filter((_, fileIndex) => fileIndex !== index),
							)
						}
						aria-label={`Cancelar ${file.name}`}
					>
						<RiCloseLine className="size-4" />
					</Button>
				</div>
			))}

			{!readonly && (
				<button
					type="button"
					className="flex min-h-16 w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					onClick={() => inputRef.current?.click()}
					disabled={disabled || uploading}
				>
					<RiAttachment2 className="size-4" />
					<span>{uploading ? "Enviando..." : "Adicionar anexos"}</span>
					<span className="hidden text-xs sm:inline">
						PDF ou imagem · máx. {maxSizeMb} MB
					</span>
				</button>
			)}

			<Dialog
				open={Boolean(removing)}
				onOpenChange={(open) => !open && setRemoving(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Remover anexo?</DialogTitle>
						<DialogDescription>
							O arquivo {removing?.fileName} será removido desta nota.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={isRemoving}>
								Cancelar
							</Button>
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							disabled={isRemoving}
							onClick={() => void confirmRemove()}
						>
							{isRemoving ? "Removendo..." : "Remover"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
