"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { dashboardNotificationStates } from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { isNotificationStatesTableMissing } from "@/shared/lib/notifications/is-table-missing";
import type { ActionResult } from "@/shared/lib/types/actions";

const notificationStateSchema = z.object({
	notificationKey: z
		.string({ message: "Chave da notificação inválida." })
		.trim()
		.min(1, "Chave da notificação inválida."),
	fingerprint: z
		.string({ message: "Fingerprint da notificação inválido." })
		.trim()
		.min(1, "Fingerprint da notificação inválido."),
});

type DashboardNotificationStateInput = z.infer<typeof notificationStateSchema>;

function revalidateNotifications(userId: string) {
	revalidateForEntity("notifications", userId);
}

async function getExistingNotificationState(
	userId: string,
	notificationKey: string,
) {
	const [existing] = await db
		.select({
			id: dashboardNotificationStates.id,
			archivedAt: dashboardNotificationStates.archivedAt,
		})
		.from(dashboardNotificationStates)
		.where(
			and(
				eq(dashboardNotificationStates.userId, userId),
				eq(dashboardNotificationStates.notificationKey, notificationKey),
			),
		)
		.limit(1);

	return existing ?? null;
}

export async function markDashboardNotificationAsReadAction(
	input: DashboardNotificationStateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = notificationStateSchema.parse(input);
		const now = new Date();
		const existing = await getExistingNotificationState(
			user.id,
			data.notificationKey,
		);

		if (existing) {
			await db
				.update(dashboardNotificationStates)
				.set({
					fingerprint: data.fingerprint,
					readAt: now,
					archivedAt: existing.archivedAt,
					updatedAt: now,
				})
				.where(
					and(
						eq(dashboardNotificationStates.userId, user.id),
						eq(
							dashboardNotificationStates.notificationKey,
							data.notificationKey,
						),
					),
				);
		} else {
			await db.insert(dashboardNotificationStates).values({
				userId: user.id,
				notificationKey: data.notificationKey,
				fingerprint: data.fingerprint,
				readAt: now,
				archivedAt: null,
				updatedAt: now,
			});
		}

		revalidateNotifications(user.id);

		return { success: true, message: "Notificação marcada como lida." };
	} catch (error) {
		if (isNotificationStatesTableMissing(error)) {
			return {
				success: false,
				error:
					"A migration das notificações ainda não foi aplicada. Rode pnpm run db:migrate para ativar a persistência.",
			};
		}

		return handleActionError(error);
	}
}

export async function markDashboardNotificationAsUnreadAction(
	input: DashboardNotificationStateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = notificationStateSchema.parse(input);
		const now = new Date();
		const existing = await getExistingNotificationState(
			user.id,
			data.notificationKey,
		);

		if (!existing) {
			return { success: true, message: "Notificação marcada como não lida." };
		}

		await db
			.update(dashboardNotificationStates)
			.set({
				fingerprint: data.fingerprint,
				readAt: null,
				archivedAt: existing.archivedAt,
				updatedAt: now,
			})
			.where(
				and(
					eq(dashboardNotificationStates.userId, user.id),
					eq(dashboardNotificationStates.notificationKey, data.notificationKey),
				),
			);

		revalidateNotifications(user.id);

		return { success: true, message: "Notificação marcada como não lida." };
	} catch (error) {
		if (isNotificationStatesTableMissing(error)) {
			return {
				success: false,
				error:
					"A migration das notificações ainda não foi aplicada. Rode pnpm run db:migrate para ativar a persistência.",
			};
		}

		return handleActionError(error);
	}
}

export async function archiveDashboardNotificationAction(
	input: DashboardNotificationStateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = notificationStateSchema.parse(input);
		const now = new Date();

		await db
			.insert(dashboardNotificationStates)
			.values({
				userId: user.id,
				notificationKey: data.notificationKey,
				fingerprint: data.fingerprint,
				readAt: now,
				archivedAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [
					dashboardNotificationStates.userId,
					dashboardNotificationStates.notificationKey,
				],
				set: {
					fingerprint: data.fingerprint,
					readAt: now,
					archivedAt: now,
					updatedAt: now,
				},
			});

		revalidateNotifications(user.id);

		return { success: true, message: "Notificação arquivada." };
	} catch (error) {
		if (isNotificationStatesTableMissing(error)) {
			return {
				success: false,
				error:
					"A migration das notificações ainda não foi aplicada. Rode pnpm run db:migrate para ativar a persistência.",
			};
		}

		return handleActionError(error);
	}
}

export async function unarchiveDashboardNotificationAction(
	input: DashboardNotificationStateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = notificationStateSchema.parse(input);
		const now = new Date();
		const existing = await getExistingNotificationState(
			user.id,
			data.notificationKey,
		);

		if (!existing) {
			return {
				success: false,
				error: "Notificação não encontrada para restaurar.",
			};
		}

		await db
			.update(dashboardNotificationStates)
			.set({
				fingerprint: data.fingerprint,
				archivedAt: null,
				readAt: now,
				updatedAt: now,
			})
			.where(
				and(
					eq(dashboardNotificationStates.userId, user.id),
					eq(dashboardNotificationStates.notificationKey, data.notificationKey),
				),
			);

		revalidateNotifications(user.id);

		return { success: true, message: "Notificação restaurada." };
	} catch (error) {
		if (isNotificationStatesTableMissing(error)) {
			return {
				success: false,
				error:
					"A migration das notificações ainda não foi aplicada. Rode pnpm run db:migrate para ativar a persistência.",
			};
		}

		return handleActionError(error);
	}
}
