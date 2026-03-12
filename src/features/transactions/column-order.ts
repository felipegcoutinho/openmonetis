/**
 * Ids das colunas reordenáveis da tabela de lançamentos (extrato).
 * select, purchaseDate e actions são fixos (início, oculto, fim).
 */
export const LANCAMENTOS_REORDERABLE_COLUMN_IDS = [
	"name",
	"transactionType",
	"amount",
	"condition",
	"paymentMethod",
	"categoriaName",
	"pagadorName",
	"note",
	"contaCartao",
] as const;

export const LANCAMENTOS_COLUMN_LABELS: Record<string, string> = {
	name: "Estabelecimento",
	transactionType: "Transação",
	amount: "Valor",
	condition: "Condição",
	paymentMethod: "Forma de Pagamento",
	categoriaName: "Categoria",
	pagadorName: "Pagador",
	note: "Anotação",
	contaCartao: "Conta/Cartão",
};

export const DEFAULT_LANCAMENTOS_COLUMN_ORDER: string[] = [
	...LANCAMENTOS_REORDERABLE_COLUMN_IDS,
];
