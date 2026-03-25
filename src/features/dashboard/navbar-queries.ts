import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { payers } from "@/db/schema";
import { fetchPendingInboxCount } from "@/features/inbox/queries";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { getBusinessDateString } from "@/shared/utils/date";
import {
	type DashboardNotificationsSnapshot,
	fetchDashboardNotifications,
} from "./notifications-queries";

export type DashboardNavbarData = {
	pagadorAvatarUrl: string | null;
	preLancamentosCount: number;
	notificationsSnapshot: DashboardNotificationsSnapshot;
};

async function fetchAdminPayerAvatarUrl(
	userId: string,
): Promise<string | null> {
	const adminPayerId = await getAdminPayerId(userId);

	if (!adminPayerId) {
		return null;
	}

	const payer = await db.query.payers.findFirst({
		columns: {
			avatarUrl: true,
		},
		where: eq(payers.id, adminPayerId),
	});

	return payer?.avatarUrl ?? null;
}

async function fetchDashboardNavbarDataInternal(
	userId: string,
): Promise<DashboardNavbarData> {
	const currentPeriod = getBusinessDateString().slice(0, 7);
	const [pagadorAvatarUrl, notificationsSnapshot, preLancamentosCount] =
		await Promise.all([
			fetchAdminPayerAvatarUrl(userId),
			fetchDashboardNotifications(userId, currentPeriod),
			fetchPendingInboxCount(userId),
		]);

	return {
		pagadorAvatarUrl,
		preLancamentosCount,
		notificationsSnapshot,
	};
}

export function fetchDashboardNavbarData(userId: string) {
	const currentPeriod = getBusinessDateString().slice(0, 7);

	return unstable_cache(
		() => fetchDashboardNavbarDataInternal(userId),
		[`dashboard-navbar-${userId}-${currentPeriod}`],
		{
			tags: [`dashboard-${userId}`],
			revalidate: 60,
		},
	)();
}
