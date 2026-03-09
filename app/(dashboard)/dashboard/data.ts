import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export interface UserDashboardPreferences {
	dashboardWidgets: string | null;
}

export async function fetchUserDashboardPreferences(
	userId: string,
): Promise<UserDashboardPreferences> {
	const result = await db
		.select({
			dashboardWidgets: schema.preferenciasUsuario.dashboardWidgets,
		})
		.from(schema.preferenciasUsuario)
		.where(eq(schema.preferenciasUsuario.userId, userId))
		.limit(1);

	return {
		dashboardWidgets: result[0]?.dashboardWidgets ?? null,
	};
}
