import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { WidgetPreferences } from "@/features/dashboard/widget-registry/widget-actions";
import { db, schema } from "@/shared/lib/db";

interface UserDashboardPreferences {
	dashboardWidgets: WidgetPreferences | null;
}

export async function fetchUserDashboardPreferences(
	userId: string,
): Promise<UserDashboardPreferences> {
	"use cache";
	cacheTag(`dashboard-${userId}`);
	cacheLife({ revalidate: 3 });

	const result = await db
		.select({
			dashboardWidgets: schema.userPreferences.dashboardWidgets,
		})
		.from(schema.userPreferences)
		.where(eq(schema.userPreferences.userId, userId))
		.limit(1);

	return {
		dashboardWidgets: result[0]?.dashboardWidgets ?? null,
	};
}
