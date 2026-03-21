export type ImportedTransaction = {
	externalId: string | null; // FITID do OFX
	date: string; // YYYY-MM-DD
	amount: number; // positivo = receita, negativo = despesa
	description: string; // MEMO ou NAME
	transactionType: "income" | "expense";
};

export type ImportStatement = {
	source: string; // nome do banco (ORG)
	accountNumber: string | null; // ACCTID
	period: { from: string; to: string } | null; // YYYY-MM-DD
	isCreditCard: boolean; // true = CREDITCARDMSGSRSV1
	transactions: ImportedTransaction[];
};
