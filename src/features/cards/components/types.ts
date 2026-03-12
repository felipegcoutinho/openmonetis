export type Card = {
	id: string;
	name: string;
	brand: string;
	status: string;
	closingDay: string;
	dueDay: string;
	note: string | null;
	logo: string | null;
	limit: number | null;
	contaId: string;
	contaName: string;
	limitInUse?: number | null;
	limitAvailable?: number | null;
};

export type CardFormValues = {
	name: string;
	brand: string;
	status: string;
	closingDay: string;
	dueDay: string;
	limit: string;
	note: string;
	logo: string;
	contaId: string;
};
