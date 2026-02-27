"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";

export type WidgetPreferences = {
	order: string[];
	hidden: string[];
};

export async function updateWidgetPreferences(
	preferences: WidgetPreferences,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getUser();

		// Check if preferences exist
		const existing = await db
			.select({ id: schema.preferenciasUsuario.id })
			.from(schema.preferenciasUsuario)
			.where(eq(schema.preferenciasUsuario.userId, user.id))
			.limit(1);

		if (existing.length > 0) {
			await db
				.update(schema.preferenciasUsuario)
				.set({
					dashboardWidgets: preferences,
					updatedAt: new Date(),
				})
				.where(eq(schema.preferenciasUsuario.userId, user.id));
		} else {
			await db.insert(schema.preferenciasUsuario).values({
				userId: user.id,
				dashboardWidgets: preferences,
			});
		}

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error updating widget preferences:", error);
		return { success: false, error: "Erro ao salvar preferências" };
	}
}

export async function resetWidgetPreferences(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const user = await getUser();

		await db
			.update(schema.preferenciasUsuario)
			.set({
				dashboardWidgets: null,
				updatedAt: new Date(),
			})
			.where(eq(schema.preferenciasUsuario.userId, user.id));

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error resetting widget preferences:", error);
		return { success: false, error: "Erro ao resetar preferências" };
	}
}
