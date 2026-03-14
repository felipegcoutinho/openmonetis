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
import {
	formatPercentageChange,
	formatPeriodLabel,
} from "@/features/reports/utils";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { CategoryReportData } from "@/shared/lib/types/reports";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import {
	getPrimaryPdfColor,
	loadExportLogoDataUrl,
} from "@/shared/utils/export-branding";
import type { FilterState } from "./types";

interface CategoryReportExportProps {
	data: CategoryReportData;
	filters: FilterState;
}

export function CategoryReportExport({
	data,
	filters,
}: CategoryReportExportProps) {
	const [isExporting, setIsExporting] = useState(false);

	const getFileName = (extension: string) => {
		const start = filters.startPeriod;
		const end = filters.endPeriod;
		return `relatorio-categorias-${start}-${end}.${extension}`;
	};

	const exportToCSV = () => {
		try {
			setIsExporting(true);

			// Build CSV content
			const headers = [
				"Categoria",
				...data.periods.map(formatPeriodLabel),
				"Total",
			];
			const rows: string[][] = [];

			// Add category rows
			data.categories.forEach((category) => {
				const row: string[] = [category.name];

				data.periods.forEach((period, periodIndex) => {
					const monthData = category.monthlyData.get(period);
					const value = monthData?.amount ?? 0;
					const percentageChange = monthData?.percentageChange;
					const isFirstMonth = periodIndex === 0;

					let cellValue = formatCurrency(value);

					// Add indicator as text
					if (!isFirstMonth && percentageChange != null) {
						const arrow = percentageChange > 0 ? "↑" : "↓";
						cellValue += ` (${arrow}${formatPercentageChange(
							percentageChange,
						)})`;
					}

					row.push(cellValue);
				});

				row.push(formatCurrency(category.total));
				rows.push(row);
			});

			// Add totals row
			const totalsRow = ["Total Geral"];
			data.periods.forEach((period) => {
				totalsRow.push(formatCurrency(data.totals.get(period) ?? 0));
			});
			totalsRow.push(formatCurrency(data.grandTotal));
			rows.push(totalsRow);

			// Generate CSV string
			const csvContent = [
				headers.join(","),
				...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
			].join("\n");

			// Create blob and download
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

			toast.success("Relatório exportado em CSV com sucesso!");
		} catch (error) {
			console.error("Error exporting to CSV:", error);
			toast.error("Erro ao exportar relatório em CSV");
		} finally {
			setIsExporting(false);
		}
	};

	const exportToExcel = () => {
		try {
			setIsExporting(true);

			// Build data array
			const headers = [
				"Categoria",
				...data.periods.map(formatPeriodLabel),
				"Total",
			];
			const rows: (string | number)[][] = [];

			// Add category rows
			data.categories.forEach((category) => {
				const row: (string | number)[] = [category.name];

				data.periods.forEach((period, periodIndex) => {
					const monthData = category.monthlyData.get(period);
					const value = monthData?.amount ?? 0;
					const percentageChange = monthData?.percentageChange;
					const isFirstMonth = periodIndex === 0;

					let cellValue: string = formatCurrency(value);

					// Add indicator as text
					if (!isFirstMonth && percentageChange != null) {
						const arrow = percentageChange > 0 ? "↑" : "↓";
						cellValue += ` (${arrow}${formatPercentageChange(
							percentageChange,
						)})`;
					}

					row.push(cellValue);
				});

				row.push(formatCurrency(category.total));
				rows.push(row);
			});

			// Add totals row
			const totalsRow: (string | number)[] = ["Total Geral"];
			data.periods.forEach((period) => {
				totalsRow.push(formatCurrency(data.totals.get(period) ?? 0));
			});
			totalsRow.push(formatCurrency(data.grandTotal));
			rows.push(totalsRow);

			// Create worksheet
			const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

			// Set column widths
			ws["!cols"] = [
				{ wch: 20 }, // Category
				...data.periods.map(() => ({ wch: 15 })), // Periods
				{ wch: 15 }, // Total
			];

			// Create workbook and download
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Relatório de Categorias");
			XLSX.writeFile(wb, getFileName("xlsx"));

			toast.success("Relatório exportado em Excel com sucesso!");
		} catch (error) {
			console.error("Error exporting to Excel:", error);
			toast.error("Erro ao exportar relatório em Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const exportToPDF = async () => {
		try {
			setIsExporting(true);

			// Create PDF
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

			// Add header
			doc.setFont("courier", "normal");
			doc.setFontSize(16);
			doc.text("Relatório de Categorias por Período", titleX, 15);

			doc.setFontSize(10);
			doc.text(
				`Período: ${formatPeriodLabel(
					filters.startPeriod,
				)} - ${formatPeriodLabel(filters.endPeriod)}`,
				titleX,
				22,
			);
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

			// Build table data
			const headers = [
				["Categoria", ...data.periods.map(formatPeriodLabel), "Total"],
			];
			const body: string[][] = [];

			// Add category rows
			data.categories.forEach((category) => {
				const row: string[] = [category.name];

				data.periods.forEach((period, periodIndex) => {
					const monthData = category.monthlyData.get(period);
					const value = monthData?.amount ?? 0;
					const percentageChange = monthData?.percentageChange;
					const isFirstMonth = periodIndex === 0;

					let cellValue = formatCurrency(value);

					// Add indicator as text
					if (!isFirstMonth && percentageChange != null) {
						const arrow = percentageChange > 0 ? "↑" : "↓";
						cellValue += `\n(${arrow}${formatPercentageChange(
							percentageChange,
						)})`;
					}

					row.push(cellValue);
				});

				row.push(formatCurrency(category.total));
				body.push(row);
			});

			// Add totals row
			const totalsRow = ["Total Geral"];
			data.periods.forEach((period) => {
				totalsRow.push(formatCurrency(data.totals.get(period) ?? 0));
			});
			totalsRow.push(formatCurrency(data.grandTotal));
			body.push(totalsRow);

			// Generate table with autoTable
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
				footStyles: {
					fillColor: [229, 231, 235], // Gray
					textColor: 0,
					fontStyle: "bold",
				},
				columnStyles: {
					0: { cellWidth: 35 }, // Category column wider
				},
				didParseCell: (cellData) => {
					// Style totals row
					if (
						cellData.row.index === body.length - 1 &&
						cellData.section === "body"
					) {
						cellData.cell.styles.fillColor = [243, 244, 246];
						cellData.cell.styles.fontStyle = "bold";
					}

					// Color coding for category rows (despesa/receita)
					if (
						cellData.section === "body" &&
						cellData.row.index < body.length - 1
					) {
						const categoryIndex = cellData.row.index;
						const category = data.categories[categoryIndex];

						if (category && cellData.column.index > 0) {
							// Apply subtle background colors
							if (category.type === "despesa") {
								cellData.cell.styles.textColor = [220, 38, 38]; // Red text
							} else if (category.type === "receita") {
								cellData.cell.styles.textColor = [22, 163, 74]; // Green text
							}
						}
					}
				},
				margin: { top: 35 },
			});

			// Save PDF
			doc.save(getFileName("pdf"));

			toast.success("Relatório exportado em PDF com sucesso!");
		} catch (error) {
			console.error("Error exporting to PDF:", error);
			toast.error("Erro ao exportar relatório em PDF");
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
					disabled={isExporting || data.categories.length === 0}
					aria-label="Exportar relatório de categorias"
				>
					<RiDownloadLine className="mr-2 h-4 w-4" aria-hidden="true" />
					{isExporting ? "Exportando..." : "Exportar"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
					<RiFileTextLine className="mr-2 h-4 w-4" aria-hidden="true" />
					Exportar como CSV
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
					<RiFileExcelLine className="mr-2 h-4 w-4" aria-hidden="true" />
					Exportar como Excel (.xlsx)
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
					<RiFilePdfLine className="mr-2 h-4 w-4" aria-hidden="true" />
					Exportar como PDF
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
