"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUser } from "@/shared/lib/auth/server";
import { db, schema } from "@/shared/lib/db";

export type WidgetPreferences = {
	order: string[];
	hidden: string[];
	myAccountsShowExcluded?: boolean;
};

type WidgetLayoutPreferences = Pick<WidgetPreferences, "order" | "hidden">;

async function upsertUserWidgetPreferences(
	userId: string,
	updates: Partial<WidgetPreferences>,
): Promise<void> {
	const existing = await db
		.select({ dashboardWidgets: schema.userPreferences.dashboardWidgets })
		.from(schema.userPreferences)
		.where(eq(schema.userPreferences.userId, userId))
		.limit(1);

	const current = existing[0]?.dashboardWidgets;
	const next: WidgetPreferences = {
		order: current?.order ?? [],
		hidden: current?.hidden ?? [],
		myAccountsShowExcluded: current?.myAccountsShowExcluded,
		...updates,
	};

	await db
		.insert(schema.userPreferences)
		.values({ userId, dashboardWidgets: next })
		.onConflictDoUpdate({
			target: schema.userPreferences.userId,
			set: { dashboardWidgets: next, updatedAt: new Date() },
		});
}

export async function updateWidgetPreferences(
	preferences: WidgetLayoutPreferences,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getUser();
		await upsertUserWidgetPreferences(user.id, preferences);
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error updating widget preferences:", error);
		return { success: false, error: "Erro ao salvar preferências" };
	}
}

export async function updateMyAccountsWidgetPreference({
	showExcludedAccounts,
}: {
	showExcludedAccounts: boolean;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getUser();
		await upsertUserWidgetPreferences(user.id, {
			myAccountsShowExcluded: showExcludedAccounts,
		});
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error updating my accounts widget preference:", error);
		return { success: false, error: "Erro ao salvar preferência do widget" };
	}
}

export async function resetWidgetPreferences(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const user = await getUser();

		await db
			.update(schema.userPreferences)
			.set({
				dashboardWidgets: null,
				updatedAt: new Date(),
			})
			.where(eq(schema.userPreferences.userId, user.id));

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error resetting widget preferences:", error);
		return { success: false, error: "Erro ao resetar preferências" };
	}
}
