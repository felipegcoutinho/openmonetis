import { eq } from "drizzle-orm";
import { payers } from "@/db/schema";
import { db } from "@/shared/lib/db";
import {
	DEFAULT_PAYER_AVATAR,
	PAYER_ROLE_ADMIN,
	PAYER_STATUS_OPTIONS,
} from "./constants";
import { normalizeNameFromEmail } from "./utils";

const DEFAULT_STATUS = PAYER_STATUS_OPTIONS[0];

interface SeedUserLike {
	id?: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

export async function ensureDefaultPagadorForUser(user: SeedUserLike) {
	const userId = user.id;

	if (!userId) {
		return;
	}

	const hasAnyPagador = await db.query.payers.findFirst({
		columns: { id: true, role: true },
		where: eq(payers.userId, userId),
	});

	if (hasAnyPagador) {
		return;
	}

	const name =
		(user.name && user.name.trim().length > 0
			? user.name.trim()
			: normalizeNameFromEmail(user.email)) || "Pessoa principal";

	// Usa a imagem do Google se disponível, senão usa o avatar padrão
	const avatarUrl = user.image ?? DEFAULT_PAYER_AVATAR;

	await db.insert(payers).values({
		name,
		email: user.email ?? null,
		status: DEFAULT_STATUS,
		role: PAYER_ROLE_ADMIN,
		avatarUrl,
		note: null,
		isAutoSend: false,
		userId,
	});
}
