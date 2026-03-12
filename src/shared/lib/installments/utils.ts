import { displayPeriod, periodToDate } from "@/shared/utils/period";

/**
 * Calcula a data da última parcela baseado no período da parcela atual
 * @param currentPeriod - Período da parcela atual no formato YYYY-MM (ex: "2025-11")
 * @param currentInstallment - Número da parcela atual
 * @param totalInstallments - Quantidade total de parcelas
 * @returns Data da última parcela
 */
export function calculateLastInstallmentDate(
	currentPeriod: string,
	currentInstallment: number,
	totalInstallments: number,
): Date {
	let currentDate: Date;
	try {
		currentDate = periodToDate(currentPeriod);
	} catch {
		return new Date();
	}

	// Calcula quantas parcelas faltam (incluindo a atual)
	// Ex: parcela 2 de 6 -> restam 5 parcelas (2, 3, 4, 5, 6)
	const remainingInstallments = totalInstallments - currentInstallment + 1;

	// Calcula quantos meses adicionar para chegar na última parcela
	// Ex: restam 5 parcelas -> adicionar 4 meses (parcela atual + 4 = 5 parcelas)
	const monthsToAdd = remainingInstallments - 1;

	// Simplificando: monthsToAdd = totalInstallments - currentInstallment
	currentDate.setMonth(currentDate.getMonth() + monthsToAdd);

	return currentDate;
}

/**
 * Formata a data da última parcela no formato "Mês de Ano"
 * Exemplo: "Março de 2026"
 */
export function formatLastInstallmentDate(date: Date): string {
	return displayPeriod(
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
	);
}

/**
 * Formata a data de compra no formato "dia, dd mmm"
 * Exemplo: "qua, 24 set"
 */
export function formatPurchaseDate(date: Date): string {
	const formatter = new Intl.DateTimeFormat("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		timeZone: "UTC",
	});

	return formatter.format(date);
}

/**
 * Formata o texto da parcela atual
 * Exemplo: "1 de 6"
 */
export function formatCurrentInstallment(
	current: number,
	total: number,
): string {
	return `${current} de ${total}`;
}
