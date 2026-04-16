"use client";

import { RiFileLine, RiFilePdf2Line, RiImageLine } from "@remixicon/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AttachmentForPeriod } from "@/features/attachments/queries";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import { formatBytes } from "@/shared/utils/number";

interface PdfCanvasProps {
	url: string;
}

function PdfCanvas({ url }: PdfCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [locked, setLocked] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLocked(false);

		async function render() {
			const pdfjsLib = await import("pdfjs-dist");
			pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

			let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;
			try {
				pdf = await pdfjsLib.getDocument(url).promise;
			} catch (err) {
				if ((err as { name?: string }).name === "PasswordException") {
					if (!cancelled) setLocked(true);
				}
				return;
			}

			const page = await pdf.getPage(1);
			const canvas = canvasRef.current;
			if (!canvas || cancelled) return;

			const containerWidth = canvas.parentElement?.offsetWidth ?? 200;
			const viewport = page.getViewport({ scale: 1 });
			const scale = containerWidth / viewport.width;
			const scaled = page.getViewport({ scale });

			canvas.width = scaled.width;
			canvas.height = scaled.height;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			await page.render({ canvasContext: ctx, canvas, viewport: scaled })
				.promise;
		}

		render().catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [url]);

	if (locked) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/50">
				<RiFilePdf2Line className="size-12 text-muted-foreground/40" />
				<span className="text-xs text-muted-foreground/60">PDF Protegido</span>
			</div>
		);
	}

	return (
		<canvas
			ref={canvasRef}
			className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
		/>
	);
}

interface AttachmentGridItemProps {
	attachment: AttachmentForPeriod;
	url?: string;
	onClick: () => void;
	onDetails: () => void;
	isLoadingDetails?: boolean;
}

export function AttachmentGridItem({
	attachment,
	url,
	onClick,
	onDetails,
	isLoadingDetails = false,
}: AttachmentGridItemProps) {
	const isPdf = attachment.mimeType === "application/pdf";
	const isImage = attachment.mimeType.startsWith("image/");
	const amount = Number.parseFloat(attachment.transactionAmount);

	return (
		<div className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:border-primary">
			{/* Thumbnail */}
			<button
				type="button"
				onClick={onClick}
				className="relative aspect-4/3 w-full border-b overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
			>
				{/* Conteúdo do thumbnail */}
				{isImage && url && (
					<Image
						src={url}
						alt={attachment.fileName}
						fill
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
						unoptimized
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				)}
				{isImage && !url && (
					<div className="h-full w-full animate-pulse bg-muted-foreground/10" />
				)}
				{isPdf && url && <PdfCanvas url={url} />}
				{isPdf && !url && (
					<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20">
						<RiFilePdf2Line className="size-14 text-red-400/60" />
					</div>
				)}
				{!isImage && !isPdf && (
					<div className="flex h-full w-full items-center justify-center bg-muted">
						<RiFileLine className="size-14 text-muted-foreground/40" />
					</div>
				)}

				{/* Overlay no hover */}
				<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
			</button>

			{/* Informações */}
			<div className="flex flex-1 flex-col gap-3 px-4 py-3">
				{/* Nome do arquivo + tipo */}
				<div className="flex items-center gap-1 min-w-0">
					<div className="shrink-0 gap-0.5 text-xs opacity-60">
						{isPdf && <RiFilePdf2Line className="size-4 text-red-500" />}
						{isImage && <RiImageLine className="size-4 text-blue-500" />}
						{!isPdf && !isImage && <RiFileLine className="size-4" />}
					</div>

					<Tooltip>
						<TooltipTrigger asChild>
							<p className="truncate text-sm font-semibold leading-tight text-foreground">
								{attachment.fileName}
							</p>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-xs">
							{attachment.fileName}
						</TooltipContent>
					</Tooltip>
				</div>

				{/* Data */}
				<span className="text-xs text-muted-foreground">
					{formatDate(attachment.purchaseDate)}
				</span>

				{/* Transação e Valor */}
				<div className="flex items-start justify-between gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<p className="truncate text-sm text-muted-foreground">
								{attachment.transactionName}
							</p>
						</TooltipTrigger>
						<TooltipContent side="top">
							{attachment.transactionName}
						</TooltipContent>
					</Tooltip>
					<span className={cn("shrink-0 text-sm font-medium tracking-tighter")}>
						{formatCurrency(amount)}
					</span>
				</div>

				{/* Footer: Tamanho + Botão Detalhes */}
				<div className="mt-auto flex items-center justify-between border-t pt-3">
					<span className="text-xs text-muted-foreground/70">
						{formatBytes(attachment.fileSize)}
					</span>
					<button
						type="button"
						onClick={onDetails}
						disabled={isLoadingDetails}
						className="text-xs text-muted-foreground/70 underline-offset-2 hover:underline focus-visible:outline-none disabled:opacity-50"
					>
						{isLoadingDetails ? "Carregando..." : "Detalhes"}
					</button>
				</div>
			</div>
		</div>
	);
}
