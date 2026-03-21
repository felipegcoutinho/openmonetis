"use client";

import { RiDownloadLine, RiUploadCloud2Line } from "@remixicon/react";
import { useRef, useState } from "react";
import { parseOfx } from "@/shared/lib/import/ofx-parser";
import type { ImportStatement } from "@/shared/lib/import/types";
import { generateXlsTemplate, parseXls } from "@/shared/lib/import/xls-parser";

interface UploadZoneProps {
	onParsed: (statement: ImportStatement) => void;
}

export function UploadZone({ onParsed }: UploadZoneProps) {
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		setError(null);
		const isOfx = /\.(ofx|qfx)$/i.test(file.name);
		const isXls = /\.(xlsx|xls)$/i.test(file.name);

		if (!isOfx && !isXls) {
			setError("Formato não suportado. Use .ofx, .qfx, .xlsx ou .xls.");
			return;
		}

		if (isOfx) {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					const statement = parseOfx(content);
					if (statement.transactions.length === 0) {
						setError("Nenhuma transação encontrada no arquivo.");
						return;
					}
					onParsed(statement);
				} catch {
					setError("Não foi possível ler o arquivo. Verifique se é um OFX válido.");
				}
			};
			reader.readAsText(file, "windows-1252");
		} else {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const buffer = e.target?.result as ArrayBuffer;
					const statement = parseXls(buffer);
					onParsed(statement);
				} catch (err) {
					setError(
						err instanceof Error
							? err.message
							: "Não foi possível ler a planilha.",
					);
				}
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleDownloadTemplate = () => {
		const bytes = generateXlsTemplate();
		const blob = new Blob([bytes], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "modelo-lancamentos.xlsx";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex flex-col gap-3">
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					const file = e.dataTransfer.files[0];
					if (file) handleFile(file);
				}}
				className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-24 transition-colors ${
					dragging
						? "border-primary bg-primary/5"
						: "border-border hover:border-primary/50 hover:bg-muted/50"
				}`}
			>
				<RiUploadCloud2Line className="text-muted-foreground size-14" />
				<div className="text-center">
					<p className="font-medium text-sm">
						Arraste um arquivo aqui ou clique para selecionar
					</p>
					<p className="mt-1 text-muted-foreground text-xs">
						.ofx · .qfx · .xlsx · .xls
					</p>
				</div>
			</button>

			<input
				ref={inputRef}
				type="file"
				accept=".ofx,.qfx,.xlsx,.xls"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) handleFile(file);
					e.target.value = "";
				}}
			/>

			<div className="flex items-center justify-between">
				{error ? (
					<p className="text-destructive text-sm">{error}</p>
				) : (
					<span />
				)}
				<button
					type="button"
					onClick={handleDownloadTemplate}
					className="flex items-center gap-1.5 text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline"
				>
					<RiDownloadLine className="size-3.5" />
					Baixar modelo .xlsx
				</button>
			</div>
		</div>
	);
}
