import ExcelJS from "exceljs";
import type {
	ImportedTransaction,
	ImportStatement,
} from "@/shared/lib/import/types";

/**
 * Converte serial number do Excel (1900 date system) para ano/mês/dia.
 * Excel trata 1900 como bissexto (serial 60 = 29/02/1900 inexistente).
 */
function excelSerialToDate(
	serial: number,
): { y: number; m: number; d: number } | null {
	if (serial < 1) return null;
	let adjusted = serial;
	if (serial > 60) adjusted--;
	const baseDate = new Date(1899, 11, 31);
	const date = new Date(baseDate.getTime() + adjusted * 86400000);
	return {
		y: date.getFullYear(),
		m: date.getMonth() + 1,
		d: date.getDate(),
	};
}

function parseDateValue(value: unknown): string | null {
	if (value == null || value === "") return null;

	// Excel date serial number
	if (typeof value === "number") {
		const date = excelSerialToDate(value);
		if (!date) return null;
		const y = date.y;
		const m = String(date.m).padStart(2, "0");
		const d = String(date.d).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	// ExcelJS pode retornar Date objects
	if (value instanceof Date) {
		const y = value.getFullYear();
		const m = String(value.getMonth() + 1).padStart(2, "0");
		const d = String(value.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	const str = String(value).trim();

	// DD/MM/YYYY
	const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (dmyMatch) {
		return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
	}

	// YYYY-MM-DD
	const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) return str;

	return null;
}

function parseAmountValue(value: unknown): number | null {
	if (value == null || value === "") return null;
	if (typeof value === "number") return Math.abs(value);
	const num = Number.parseFloat(
		String(value)
			.replace(",", ".")
			.replace(/[^\d.-]/g, ""),
	);
	return Number.isNaN(num) ? null : Math.abs(num);
}

export async function parseXls(buffer: ArrayBuffer): Promise<ImportStatement> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	if (workbook.worksheets.length === 0) {
		throw new Error("Arquivo sem abas.");
	}

	const sheet = workbook.worksheets[0];

	if (!sheet || sheet.rowCount < 2) {
		throw new Error(
			`Planilha vazia ou sem dados (${sheet?.rowCount ?? 0} linha(s) encontrada(s)).`,
		);
	}

	const transactions: ImportedTransaction[] = [];

	sheet.eachRow((row, rowNumber) => {
		if (rowNumber === 1) return; // skip header

		// ExcelJS row.values é 1-indexed (values[0] é undefined)
		const values = row.values as unknown[];
		const date = parseDateValue(values[1]);
		const description = values[2] != null ? String(values[2]).trim() : "";
		const amount = parseAmountValue(values[3]);
		const typeRaw =
			values[4] != null ? String(values[4]).toLowerCase().trim() : "";
		const transactionType = typeRaw === "receita" ? "income" : "expense";

		if (!date || !description || amount === null || amount <= 0) return;

		transactions.push({
			externalId: null,
			date,
			amount,
			description,
			transactionType,
		});
	});

	if (transactions.length === 0) {
		throw new Error("Nenhuma transação válida encontrada na planilha.");
	}

	const dates = transactions.map((t) => t.date).sort();
	const period = { from: dates[0], to: dates[dates.length - 1] };

	return {
		source: "Planilha",
		accountNumber: null,
		period,
		isCreditCard: false,
		transactions,
	};
}

export async function generateXlsTemplate(): Promise<ArrayBuffer> {
	const workbook = new ExcelJS.Workbook();
	const ws = workbook.addWorksheet("Lançamentos");

	ws.addRows([
		["Data", "Descrição", "Valor", "Tipo"],
		["01/03/2026", "Ingressos São Januário", 160, "despesa"],
		["01/03/2026", "Salário", 3000.0, "receita"],
		["01/03/2026", "Posto do Vasco da Gama", 89.9, "despesa"],
	]);

	ws.getColumn(1).width = 14;
	ws.getColumn(2).width = 32;
	ws.getColumn(3).width = 12;
	ws.getColumn(4).width = 10;

	// Dropdown para coluna Tipo (D2:D100)
	for (let i = 2; i <= 100; i++) {
		ws.getCell(`D${i}`).dataValidation = {
			type: "list",
			allowBlank: true,
			formulae: ['"despesa,receita"'],
		};
	}

	const buffer = await workbook.xlsx.writeBuffer();
	return buffer as ArrayBuffer;
}
