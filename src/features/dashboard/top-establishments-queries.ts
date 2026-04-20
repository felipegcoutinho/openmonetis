export type TopEstablishment = {
	id: string;
	name: string;
	amount: number;
	occurrences: number;
	logo: string | null;
};

export type TopEstablishmentsData = {
	establishments: TopEstablishment[];
};
