"use client";

import {
	RiDownloadLine,
	RiFileExcelLine,
	RiFilePdfLine,
	RiFileTextLine,
} from "@remixicon/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/lancamentos/formatting-helpers";
import type { LancamentoItem } from "./types";

interface LancamentosExportProps {
	lancamentos: LancamentoItem[];
	period: string;
}

export function LancamentosExport({
	lancamentos,
	period,
}: LancamentosExportProps) {
	const [isExporting, setIsExporting] = useState(false);

	const getFileName = (extension: string) => {
		return `lancamentos-${period}.${extension}`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const getContaCartaoName = (lancamento: LancamentoItem) => {
		if (lancamento.contaName) return lancamento.contaName;
		if (lancamento.cartaoName) return lancamento.cartaoName;
		return "-";
	};

	const exportToCSV = () => {
		try {
			setIsExporting(true);

			const headers = [
				"Data",
				"Nome",
				"Tipo",
				"Condição",
				"Pagamento",
				"Valor",
				"Categoria",
				"Conta/Cartão",
				"Pagador",
			];
			const rows: string[][] = [];

			lancamentos.forEach((lancamento) => {
				const row = [
					formatDate(
						lancamento.originalPurchaseDate ?? lancamento.purchaseDate,
					),
					lancamento.name,
					lancamento.transactionType,
					lancamento.condition,
					lancamento.paymentMethod,
					formatCurrency(lancamento.amount),
					lancamento.categoriaName ?? "-",
					getContaCartaoName(lancamento),
					lancamento.pagadorName ?? "-",
				];
				rows.push(row);
			});

			const csvContent = [
				headers.join(","),
				...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
			].join("\n");

			const blob = new Blob([`\uFEFF${csvContent}`], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = getFileName("csv");
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Lançamentos exportados em CSV com sucesso!");
		} catch (error) {
			console.error("Error exporting to CSV:", error);
			toast.error("Erro ao exportar lançamentos em CSV");
		} finally {
			setIsExporting(false);
		}
	};

	const exportToExcel = () => {
		try {
			setIsExporting(true);

			const headers = [
				"Data",
				"Nome",
				"Tipo",
				"Condição",
				"Pagamento",
				"Valor",
				"Categoria",
				"Conta/Cartão",
				"Pagador",
			];
			const rows: (string | number)[][] = [];

			lancamentos.forEach((lancamento) => {
				const row = [
					formatDate(
						lancamento.originalPurchaseDate ?? lancamento.purchaseDate,
					),
					lancamento.name,
					lancamento.transactionType,
					lancamento.condition,
					lancamento.paymentMethod,
					lancamento.amount,
					lancamento.categoriaName ?? "-",
					getContaCartaoName(lancamento),
					lancamento.pagadorName ?? "-",
				];
				rows.push(row);
			});

			const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

			ws["!cols"] = [
				{ wch: 12 }, // Data
				{ wch: 30 }, // Nome
				{ wch: 15 }, // Tipo
				{ wch: 15 }, // Condição
				{ wch: 20 }, // Pagamento
				{ wch: 15 }, // Valor
				{ wch: 20 }, // Categoria
				{ wch: 20 }, // Conta/Cartão
				{ wch: 20 }, // Pagador
			];

			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
			XLSX.writeFile(wb, getFileName("xlsx"));

			toast.success("Lançamentos exportados em Excel com sucesso!");
		} catch (error) {
			console.error("Error exporting to Excel:", error);
			toast.error("Erro ao exportar lançamentos em Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const exportToPDF = () => {
		try {
			setIsExporting(true);

			const doc = new jsPDF({ orientation: "landscape" });

			doc.setFontSize(16);
			doc.text("Lançamentos", 14, 15);

			doc.setFontSize(10);
			const periodParts = period.split("-");
			const monthNames = [
				"Janeiro",
				"Fevereiro",
				"Março",
				"Abril",
				"Maio",
				"Junho",
				"Julho",
				"Agosto",
				"Setembro",
				"Outubro",
				"Novembro",
				"Dezembro",
			];
			const formattedPeriod =
				periodParts.length === 2
					? `${monthNames[Number.parseInt(periodParts[1], 10) - 1]}/${periodParts[0]}`
					: period;
			doc.text(`Período: ${formattedPeriod}`, 14, 22);
			doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 27);

			const headers = [
				[
					"Data",
					"Nome",
					"Tipo",
					"Condição",
					"Pagamento",
					"Valor",
					"Categoria",
					"Conta/Cartão",
					"Pagador",
				],
			];

			const body = lancamentos.map((lancamento) => [
				formatDate(
					lancamento.originalPurchaseDate ?? lancamento.purchaseDate,
				),
				lancamento.name,
				lancamento.transactionType,
				lancamento.condition,
				lancamento.paymentMethod,
				formatCurrency(lancamento.amount),
				lancamento.categoriaName ?? "-",
				getContaCartaoName(lancamento),
				lancamento.pagadorName ?? "-",
			]);

			autoTable(doc, {
				head: headers,
				body: body,
				startY: 32,
				styles: {
					fontSize: 8,
					cellPadding: 2,
				},
				headStyles: {
					fillColor: [59, 130, 246],
					textColor: 255,
					fontStyle: "bold",
				},
				columnStyles: {
					0: { cellWidth: 20 }, // Data
					1: { cellWidth: 40 }, // Nome
					2: { cellWidth: 25 }, // Tipo
					3: { cellWidth: 25 }, // Condição
					4: { cellWidth: 30 }, // Pagamento
					5: { cellWidth: 25 }, // Valor
					6: { cellWidth: 30 }, // Categoria
					7: { cellWidth: 30 }, // Conta/Cartão
					8: { cellWidth: 30 }, // Pagador
				},
				didParseCell: (cellData) => {
					if (cellData.section === "body" && cellData.column.index === 5) {
						const lancamento = lancamentos[cellData.row.index];
						if (lancamento) {
							if (lancamento.transactionType === "Despesa") {
								cellData.cell.styles.textColor = [220, 38, 38];
							} else if (lancamento.transactionType === "Receita") {
								cellData.cell.styles.textColor = [22, 163, 74];
							}
						}
					}
				},
				margin: { top: 32 },
			});

			doc.save(getFileName("pdf"));

			toast.success("Lançamentos exportados em PDF com sucesso!");
		} catch (error) {
			console.error("Error exporting to PDF:", error);
			toast.error("Erro ao exportar lançamentos em PDF");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="text-sm border-dashed"
					disabled={isExporting || lancamentos.length === 0}
					aria-label="Exportar lançamentos"
				>
					<RiDownloadLine className="size-4" />
					{isExporting ? "Exportando..." : "Exportar"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
					<RiFileTextLine className="mr-2 h-4 w-4" />
					Exportar como CSV
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
					<RiFileExcelLine className="mr-2 h-4 w-4" />
					Exportar como Excel (.xlsx)
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
					<RiFilePdfLine className="mr-2 h-4 w-4" />
					Exportar como PDF
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
