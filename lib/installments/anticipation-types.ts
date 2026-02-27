import type {
	AntecipacaoParcela,
	Categoria,
	Lancamento,
	Pagador,
} from "@/db/schema";

/**
 * Parcela elegível para antecipação
 */
export type EligibleInstallment = {
	id: string;
	name: string;
	amount: string;
	period: string;
	purchaseDate: Date;
	dueDate: Date | null;
	currentInstallment: number | null;
	installmentCount: number | null;
	paymentMethod: string;
	categoriaId: string | null;
	pagadorId: string | null;
};

/**
 * Antecipação com dados completos
 */
export type InstallmentAnticipationWithRelations = AntecipacaoParcela & {
	lancamento: Lancamento;
	pagador: Pagador | null;
	categoria: Categoria | null;
};

/**
 * Input para criar antecipação
 */
export type CreateAnticipationInput = {
	seriesId: string;
	installmentIds: string[];
	anticipationPeriod: string;
	pagadorId?: string;
	categoriaId?: string;
	note?: string;
};

/**
 * Input para cancelar antecipação
 */
export type CancelAnticipationInput = {
	anticipationId: string;
};
