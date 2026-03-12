import type { EligibleInstallment } from "./anticipation-types";

/**
 * Formata o resumo de parcelas antecipadas
 * Exemplo: "Parcelas 1-3 de 12" ou "Parcela 5 de 12"
 */
export function formatAnticipatedInstallmentsRange(
	installments: EligibleInstallment[],
): string {
	const numbers = installments
		.map((inst) => inst.currentInstallment)
		.filter((num): num is number => num !== null)
		.sort((a, b) => a - b);

	if (numbers.length === 0) return "";
	if (numbers.length === 1) {
		const total = installments[0]?.installmentCount ?? 0;
		return `Parcela ${numbers[0]} de ${total}`;
	}

	const first = numbers[0];
	const last = numbers[numbers.length - 1];
	const total = installments[0]?.installmentCount ?? 0;

	// Se as parcelas são consecutivas
	const isConsecutive = numbers.every((num, i) => {
		if (i === 0) return true;
		return num === (numbers[i - 1] ?? 0) + 1;
	});

	if (isConsecutive) {
		return `Parcelas ${first}-${last} de ${total}`;
	} else {
		return `${numbers.length} parcelas de ${total}`;
	}
}

/**
 * Calcula quantas parcelas restam após uma antecipação
 */
export function calculateRemainingInstallments(
	totalInstallments: number,
	anticipatedCount: number,
): number {
	return Math.max(0, totalInstallments - anticipatedCount);
}

/**
 * Gera descrição automática para o lançamento de antecipação
 */
export function generateAnticipationDescription(
	lancamentoName: string,
	installmentCount: number,
): string {
	return `Antecipação de ${installmentCount} ${
		installmentCount === 1 ? "parcela" : "parcelas"
	} - ${lancamentoName}`;
}

/**
 * Formata nota automática para antecipação
 */
export function generateAnticipationNote(
	installments: EligibleInstallment[],
): string {
	const range = formatAnticipatedInstallmentsRange(installments);
	return `Antecipação: ${range}`;
}
