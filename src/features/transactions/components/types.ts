export type TransactionItem = {
	id: string;
	userId: string;
	name: string;
	purchaseDate: string;
	period: string;
	transactionType: string;
	amount: number;
	condition: string;
	paymentMethod: string;
	payerId: string | null;
	pagadorName: string | null;
	pagadorAvatar: string | null;
	pagadorRole: string | null;
	accountId: string | null;
	contaName: string | null;
	contaLogo: string | null;
	cardId: string | null;
	cartaoName: string | null;
	cartaoLogo: string | null;
	categoryId: string | null;
	categoriaName: string | null;
	categoriaType: string | null;
	categoriaIcon: string | null;
	installmentCount: number | null;
	recurrenceCount: number | null;
	currentInstallment: number | null;
	dueDate: string | null;
	boletoPaymentDate: string | null;
	note: string | null;
	isSettled: boolean | null;
	isDivided: boolean;
	isAnticipated: boolean;
	anticipationId: string | null;
	seriesId: string | null;
	hasAttachments: boolean;
	readonly?: boolean;
};

export type SelectOption = {
	value: string;
	label: string;
	role?: string | null;
	group?: string | null;
	slug?: string | null;
	avatarUrl?: string | null;
	logo?: string | null;
	icon?: string | null;
	accountType?: string | null;
	closingDay?: string | null;
	dueDay?: string | null;
};

export type TransactionFilterOption = {
	slug: string;
	label: string;
	icon?: string | null;
	avatarUrl?: string | null;
};

export type AccountCardFilterOption = TransactionFilterOption & {
	kind: "conta" | "cartao";
	logo?: string | null;
};
