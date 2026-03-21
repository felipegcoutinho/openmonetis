import * as XLSX from "xlsx";
import type { ImportStatement, ImportedTransaction } from "@/shared/lib/import/types";

function parseDateValue(value: unknown): string | null {
	if (value == null || value === "") return null;

	// Excel date serial number
	if (typeof value === "number") {
		const date = XLSX.SSF.parse_date_code(value);
		if (!date) return null;
		const y = date.y;
		const m = String(date.m).padStart(2, "0");
		const d = String(date.d).padStart(2, "0");
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

export function parseXls(buffer: ArrayBuffer): ImportStatement {
	const workbook = XLSX.read(new Uint8Array(buffer), {
		type: "array",
		cellDates: false,
	});

	if (!workbook.SheetNames.length) {
		throw new Error("Arquivo sem abas.");
	}

	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];

	if (!sheet) {
		throw new Error(`Aba "${sheetName}" não encontrada.`);
	}

	const range = sheet["!ref"];
	if (!range) {
		throw new Error("Planilha vazia (sem intervalo de células).");
	}

	const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
		header: 1,
		defval: "",
	});

	if (rows.length < 2) {
		throw new Error(
			`Planilha vazia ou sem dados (${rows.length} linha(s) encontrada(s)).`,
		);
	}

	const transactions: ImportedTransaction[] = [];

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i] as unknown[];
		if (!row || row.every((cell) => cell == null || cell === "")) continue;

		const date = parseDateValue(row[0]);
		const description = row[1] != null ? String(row[1]).trim() : "";
		const amount = parseAmountValue(row[2]);
		const typeRaw = row[3] != null ? String(row[3]).toLowerCase().trim() : "";
		const transactionType = typeRaw === "receita" ? "income" : "expense";

		if (!date || !description || amount === null || amount <= 0) continue;

		transactions.push({
			externalId: null,
			date,
			amount,
			description,
			transactionType,
		});
	}

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

export function generateXlsTemplate(): ArrayBuffer {
	const wb = XLSX.utils.book_new();

	const data = [
		["Data", "Descrição", "Valor", "Tipo"],
		["01/03/2026", "Ingressos São Januário", 160, "despesa"],
		["01/03/2026", "Salário", 3000.0, "receita"],
		["01/03/2026", "Posto do Vasco da Gama", 89.9, "despesa"],
	];

	const ws = XLSX.utils.aoa_to_sheet(data);

	ws["!cols"] = [{ wch: 14 }, { wch: 32 }, { wch: 12 }, { wch: 10 }];

	// Dropdown para coluna Tipo (D2:D1000)
	if (!ws["!dataValidations"]) ws["!dataValidations"] = [];
	(ws["!dataValidations"] as object[]).push({
		type: "list",
		sqref: "D2:D1000",
		formula1: '"despesa,receita"',
		showDropDown: false,
	});

	XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

	const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
	return new Uint8Array(raw).buffer as ArrayBuffer;
}
