import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { loadAvatarOptions } from "@/features/payers/lib/avatar-options";
import { db } from "@/shared/lib/db";
import { fetchPayersWithAccess } from "@/shared/lib/payers/access";
import type { PayerStatus } from "@/shared/lib/payers/constants";
import {
	PAYER_ROLE_ADMIN,
	PAYER_STATUS_OPTIONS,
} from "@/shared/lib/payers/constants";

type PayerData = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	status: PayerStatus;
	note: string | null;
	role: string | null;
	isAutoSend: boolean;
	createdAt: string;
	canEdit: boolean;
	sharedByName: string | null;
	sharedByEmail: string | null;
	shareId: string | null;
	shareCode: string | null;
};

const resolveStatus = (status: string | null): PayerStatus => {
	const normalized = status?.trim() ?? "";
	const found = PAYER_STATUS_OPTIONS.find(
		(option) => option.toLowerCase() === normalized.toLowerCase(),
	);
	return found ?? PAYER_STATUS_OPTIONS[0];
};

export async function fetchPayersForUser(
	userId: string,
): Promise<{ payers: PayerData[]; avatarOptions: string[] }> {
	const [payerRows, localAvatarOptions, userData] = await Promise.all([
		fetchPayersWithAccess(userId),
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

	const payers = payerRows
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
			if (a.role === PAYER_ROLE_ADMIN && b.role !== PAYER_ROLE_ADMIN) return -1;
			if (a.role !== PAYER_ROLE_ADMIN && b.role === PAYER_ROLE_ADMIN) return 1;
			return 0;
		});

	return { payers, avatarOptions };
}
