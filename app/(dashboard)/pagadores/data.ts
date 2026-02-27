import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { loadAvatarOptions } from "@/lib/avatar/options";
import { db } from "@/lib/db";
import { fetchPagadoresWithAccess } from "@/lib/pagadores/access";
import type { PagadorStatus } from "@/lib/pagadores/constants";
import {
	PAGADOR_ROLE_ADMIN,
	PAGADOR_STATUS_OPTIONS,
} from "@/lib/pagadores/constants";

export type PagadorData = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	status: PagadorStatus;
	note: string | null;
	role: string;
	isAutoSend: boolean;
	createdAt: string;
	canEdit: boolean;
	sharedByName: string | null;
	sharedByEmail: string | null;
	shareId: string | null;
	shareCode: string | null;
};

const resolveStatus = (status: string | null): PagadorStatus => {
	const normalized = status?.trim() ?? "";
	const found = PAGADOR_STATUS_OPTIONS.find(
		(option) => option.toLowerCase() === normalized.toLowerCase(),
	);
	return found ?? PAGADOR_STATUS_OPTIONS[0];
};

export async function fetchPagadoresForUser(
	userId: string,
): Promise<{ pagadores: PagadorData[]; avatarOptions: string[] }> {
	const [pagadorRows, localAvatarOptions, userData] = await Promise.all([
		fetchPagadoresWithAccess(userId),
		loadAvatarOptions(),
		db.query.user.findFirst({
			columns: { image: true },
			where: eq(user.id, userId),
		}),
	]);

	const userImage = userData?.image;
	const avatarOptions = userImage
		? [userImage, ...localAvatarOptions]
		: localAvatarOptions;

	const pagadores = pagadorRows
		.map((pagador) => ({
			id: pagador.id,
			name: pagador.name,
			email: pagador.email,
			avatarUrl: pagador.avatarUrl,
			status: resolveStatus(pagador.status),
			note: pagador.note,
			role: pagador.role,
			isAutoSend: pagador.isAutoSend ?? false,
			createdAt: pagador.createdAt?.toISOString() ?? new Date().toISOString(),
			canEdit: pagador.canEdit,
			sharedByName: pagador.sharedByName ?? null,
			sharedByEmail: pagador.sharedByEmail ?? null,
			shareId: pagador.shareId ?? null,
			shareCode: pagador.canEdit ? (pagador.shareCode ?? null) : null,
		}))
		.sort((a, b) => {
			if (a.role === PAGADOR_ROLE_ADMIN && b.role !== PAGADOR_ROLE_ADMIN)
				return -1;
			if (a.role !== PAGADOR_ROLE_ADMIN && b.role === PAGADOR_ROLE_ADMIN)
				return 1;
			return 0;
		});

	return { pagadores, avatarOptions };
}
