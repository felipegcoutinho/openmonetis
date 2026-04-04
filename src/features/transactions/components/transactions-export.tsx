"use client";

import {
	RiDownloadLine,
	RiFileExcelLine,
	RiFilePdf2Line,
	RiFileTextLine,
} from "@remixicon/react";
import { useState } from "react";
import { toast } from "sonner";
import { exportTransactionsDataAction } from "@/features/transactions/actions";
import type { TransactionsExportContext } from "@/features/transactions/export-types";
import { formatCurrency } from "@/features/transactions/formatting-helpers";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { formatDateOnly, formatDateTime } from "@/shared/utils/date";
import {
	getPrimaryPdfColor,
	loadExportLogoDataUrl,
} from "@/shared/utils/export-branding";
import { displayPeriod } from "@/shared/utils/period";
import type { TransactionItem } from "./types";

interface LancamentosExportProps {
	lancamentos: TransactionItem[];
	period: string;
	exportContext?: TransactionsExportContext;
}

const loadExcelJS = () => import("exceljs");

const loadPdfDeps = async () => {
	const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
		import("jspdf"),
		import("jspdf-autotable"),
	]);

	return { jsPDF, autoTable };
};

export function TransactionsExport({
	lancamentos,
	period,
	exportContext,
}: LancamentosExportProps) {
	const [isExporting, setIsExporting] = useState(false);

	const getFileName = (extension: string) => {
		return `lancamentos-${period}.${extension}`;
	};

	const formatDate = (dateString: string) => {
		return (
			formatDateOnly(dateString, {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			}) ?? dateString
		);
	};

	const getContaCartaoName = (transaction: TransactionItem) => {
		if (transaction.contaName) return transaction.contaName;
		if (transaction.cartaoName) return transaction.cartaoName;
		return "-";
	};

	const getNameWithInstallment = (transaction: TransactionItem) => {
		const isInstallment =
			transaction.condition.trim().toLowerCase() === "parcelado";

		if (!isInstallment || !transaction.installmentCount) {
			return transaction.name;
		}

		return `${transaction.name} (${transaction.currentInstallment ?? 1}/${transaction.installmentCount})`;
	};

	const loadTransactions = async () => {
		if (!exportContext) {
			return lancamentos;
		}

		const result = await exportTransactionsDataAction(exportContext);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data?.transactions ?? [];
	};

	const exportToCSV = async () => {
		try {
			setIsExporting(true);
			const transactions = await loadTransactions();

			const headers = [
				"Data",
				"Nome",
				"Tipo",
				"Condição",
				"Pagamento",
				"Valor",
				"Category",
				"Conta/Cartão",
				"Payer",
			];
			const rows: string[][] = [];

			transactions.forEach((lancamento) => {
				const row = [
					formatDate(lancamento.purchaseDate),
					getNameWithInstallment(lancamento),
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

	const exportToExcel = async () => {
		try {
			setIsExporting(true);
			const transactions = await loadTransactions();
			const ExcelJS = await loadExcelJS();

			const headers = [
				"Data",
				"Nome",
				"Tipo",
				"Condição",
				"Pagamento",
				"Valor",
				"Category",
				"Conta/Cartão",
				"Payer",
			];
			const rows: (string | number)[][] = [];

			transactions.forEach((lancamento) => {
				const row = [
					formatDate(lancamento.purchaseDate),
					getNameWithInstallment(lancamento),
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

			const workbook = new ExcelJS.Workbook();
			const ws = workbook.addWorksheet("Lançamentos");

			ws.addRows([headers, ...rows]);

			const colWidths = [12, 42, 15, 15, 20, 15, 20, 20, 20];
			colWidths.forEach((w, i) => {
				ws.getColumn(i + 1).width = w;
			});

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = getFileName("xlsx");
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Lançamentos exportados em Excel com sucesso!");
		} catch (error) {
			console.error("Error exporting to Excel:", error);
			toast.error("Erro ao exportar lançamentos em Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const exportToPDF = async () => {
		try {
			setIsExporting(true);
			const transactions = await loadTransactions();
			const { jsPDF, autoTable } = await loadPdfDeps();

			const doc = new jsPDF({ orientation: "landscape" });
			const primaryColor = getPrimaryPdfColor();
			const [smallLogoDataUrl, textLogoDataUrl] = await Promise.all([
				loadExportLogoDataUrl("/images/logo_small.png"),
				loadExportLogoDataUrl("/images/logo_text.png"),
			]);
			let brandingEndX = 14;

			if (smallLogoDataUrl) {
				doc.addImage(smallLogoDataUrl, "PNG", brandingEndX, 7.5, 8, 8);
				brandingEndX += 10;
			}

			if (textLogoDataUrl) {
				doc.addImage(textLogoDataUrl, "PNG", brandingEndX, 8, 30, 8);
				brandingEndX += 32;
			}

			const titleX = brandingEndX > 14 ? brandingEndX + 4 : 14;

			doc.setFont("courier", "normal");
			doc.setFontSize(16);
			doc.text("Lançamentos", titleX, 15);

			doc.setFontSize(10);
			doc.text(`Período: ${displayPeriod(period)}`, titleX, 22);
			doc.text(
				`Gerado em: ${
					formatDateTime(new Date(), {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
					}) ?? "—"
				}`,
				titleX,
				27,
			);
			doc.setDrawColor(...primaryColor);
			doc.setLineWidth(0.5);
			doc.line(14, 31, doc.internal.pageSize.getWidth() - 14, 31);

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
					"Payer",
				],
			];

			const body = transactions.map((lancamento) => [
				formatDate(lancamento.purchaseDate),
				getNameWithInstallment(lancamento),
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
				startY: 35,
				tableWidth: "auto",
				styles: {
					font: "courier",
					fontSize: 8,
					cellPadding: 2,
				},
				headStyles: {
					fillColor: primaryColor,
					textColor: 255,
					fontStyle: "bold",
				},
				columnStyles: {
					0: { cellWidth: 24 }, // Data
					1: { cellWidth: 58 }, // Nome
					2: { cellWidth: 22 }, // Tipo
					3: { cellWidth: 22 }, // Condição
					4: { cellWidth: 28 }, // Pagamento
					5: { cellWidth: 24 }, // Valor
					6: { cellWidth: 30 }, // Categoria
					7: { cellWidth: 30 }, // Conta/Cartão
					8: { cellWidth: 31 }, // Payer
				},
				didParseCell: (cellData) => {
					if (cellData.section === "body" && cellData.column.index === 5) {
						const lancamento = transactions[cellData.row.index];
						if (lancamento) {
							if (lancamento.transactionType === "Despesa") {
								cellData.cell.styles.textColor = [220, 38, 38];
							} else if (lancamento.transactionType === "Receita") {
								cellData.cell.styles.textColor = [22, 163, 74];
							}
						}
					}
				},
				margin: { top: 35 },
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
					<RiFilePdf2Line className="mr-2 h-4 w-4" />
					Exportar como PDF
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
