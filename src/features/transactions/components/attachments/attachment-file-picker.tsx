"use client";

import { RiAttachment2, RiCloseLine } from "@remixicon/react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	ALLOWED_MIME_TYPES,
	DEFAULT_MAX_FILE_SIZE_MB,
} from "@/features/transactions/attachments-config";
import { Button } from "@/shared/components/ui/button";

interface AttachmentFilePickerProps {
	file: File | null;
	onChange: (file: File | null) => void;
	maxSizeMb?: number;
}

export function AttachmentFilePicker({
	file,
	onChange,
	maxSizeMb = DEFAULT_MAX_FILE_SIZE_MB,
}: AttachmentFilePickerProps) {
	const maxFileSizeBytes = maxSizeMb * 1024 * 1024;
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (inputRef.current) inputRef.current.value = "";

		if (!selected) return;

		if (
			!ALLOWED_MIME_TYPES.includes(
				selected.type as (typeof ALLOWED_MIME_TYPES)[number],
			)
		) {
			toast.error(
				"Tipo de arquivo não suportado. Use PDF ou imagem (JPEG, PNG, WebP).",
			);
			return;
		}

		if (selected.size > maxFileSizeBytes) {
			toast.error(`O arquivo deve ter no máximo ${maxSizeMb}MB.`);
			return;
		}

		onChange(selected);
	}

	return (
		<div className="space-y-1.5">
			<p className="text-xs">Anexo</p>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept={ALLOWED_MIME_TYPES.join(",")}
				onChange={handleFileChange}
			/>

			{file ? (
				<div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-md border px-3 py-2 text-sm">
					<RiAttachment2 className="size-4 shrink-0 text-muted-foreground" />
					<span className="min-w-0 flex-1 truncate" title={file.name}>
						{file.name}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-6 shrink-0"
						onClick={() => onChange(null)}
					>
						<RiCloseLine className="size-4" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
					onClick={() => inputRef.current?.click()}
				>
					<span className="flex items-center gap-2">
						<RiAttachment2 className="size-4" />
						Adicionar anexo
					</span>
					<span className="text-xs">
						PDF, JPEG, PNG ou WebP · máx. {maxSizeMb} MB
					</span>
				</button>
			)}
		</div>
	);
}
