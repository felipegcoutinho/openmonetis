import type { PagadorStatus } from "@/shared/lib/payers/constants";

export type Pagador = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	status: PagadorStatus;
	note: string | null;
	role: string | null;
	isAutoSend: boolean;
	createdAt: string;
	canEdit: boolean;
	sharedByName?: string | null;
	sharedByEmail?: string | null;
	shareId?: string | null;
	shareCode?: string | null;
};

export type PagadorFormValues = {
	name: string;
	email: string;
	status: PagadorStatus;
	avatarUrl: string;
	note: string;
	isAutoSend: boolean;
};
