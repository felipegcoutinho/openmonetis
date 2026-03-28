"use client";

import { RiAttachment2 } from "@remixicon/react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	confirmAttachmentUploadAction,
	getPresignedUploadUrlAction,
} from "@/features/transactions/actions/attachments";
import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE,
} from "@/features/transactions/attachments-config";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

interface AttachmentUploadProps {
	transactionId: string;
	seriesId: string | null;
	onUploaded: () => void;
}

export function AttachmentUpload({
	transactionId,
	seriesId,
	onUploaded,
}: AttachmentUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isPending, startTransition] = useTransition();
	const [applyToSeries, setApplyToSeries] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!inputRef.current) return;
		inputRef.current.value = "";

		if (!file) return;

		if (
			!ALLOWED_MIME_TYPES.includes(
				file.type as (typeof ALLOWED_MIME_TYPES)[number],
			)
		) {
			toast.error(
				"Tipo de arquivo não suportado. Use PDF ou imagem (JPEG, PNG, WebP).",
			);
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error("O arquivo deve ter no máximo 50MB.");
			return;
		}

		if (seriesId) {
			setPendingFile(file);
		} else {
			uploadFile(file, false);
		}
	}

	function uploadFile(file: File, toSeries: boolean) {
		startTransition(async () => {
			const presignResult = await getPresignedUploadUrlAction({
				fileName: file.name,
				mimeType: file.type,
				fileSize: file.size,
				transactionId,
			});

			if (!presignResult.success) {
				toast.error(presignResult.error ?? "Erro ao iniciar upload.");
				return;
			}

			const uploadResponse = await fetch(presignResult.presignedUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});

			if (!uploadResponse.ok) {
				toast.error("Erro ao enviar o arquivo. Tente novamente.");
				return;
			}

			const confirmResult = await confirmAttachmentUploadAction({
				uploadToken: presignResult.uploadToken,
				applyToSeries: toSeries,
			});

			if (confirmResult.success) {
				toast.success(confirmResult.message);
				setPendingFile(null);
				setApplyToSeries(false);
				onUploaded();
			} else {
				toast.error(confirmResult.error);
			}
		});
	}

	function handleConfirmPending() {
		if (pendingFile) uploadFile(pendingFile, applyToSeries);
	}

	function handleCancelPending() {
		setPendingFile(null);
		setApplyToSeries(false);
	}

	if (pendingFile) {
		return (
			<div className="min-w-0 space-y-2 rounded-md border border-dashed p-3 text-sm">
				<div className="min-w-0 overflow-hidden">
					<p className="truncate font-medium" title={pendingFile.name}>
						{pendingFile.name}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="apply-series"
						checked={applyToSeries}
						onCheckedChange={(v) => setApplyToSeries(Boolean(v))}
					/>
					<Label htmlFor="apply-series" className="cursor-pointer text-xs">
						Aplicar a todas as parcelas da série
					</Label>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						size="sm"
						onClick={handleConfirmPending}
						disabled={isPending}
					>
						{isPending ? "Enviando..." : "Confirmar"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={handleCancelPending}
						disabled={isPending}
					>
						Cancelar
					</Button>
				</div>
			</div>
		);
	}

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept={ALLOWED_MIME_TYPES.join(",")}
				onChange={handleFileChange}
			/>
			<button
				type="button"
				className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
				onClick={() => inputRef.current?.click()}
				disabled={isPending}
			>
				<span className="flex items-center gap-2">
					<RiAttachment2 className="size-4" />
					{isPending ? "Enviando..." : "Adicionar anexo"}
				</span>
				{!isPending && (
					<span className="text-xs">PDF, JPEG, PNG ou WebP · máx. 50 MB</span>
				)}
			</button>
		</>
	);
}
