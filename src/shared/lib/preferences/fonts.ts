import { eq } from "drizzle-orm";
import { cache } from "react";
import {
	DEFAULT_FONT_KEY,
	type FontKey,
	normalizeFontKey,
} from "@/public/fonts/font_index";
import { db, schema } from "@/shared/lib/db";

export type FontPreferences = {
	systemFont: FontKey;
	moneyFont: FontKey;
};

const DEFAULT_FONT_PREFS: FontPreferences = {
	systemFont: DEFAULT_FONT_KEY,
	moneyFont: DEFAULT_FONT_KEY,
};

export const fetchUserFontPreferences = cache(
	async (userId: string): Promise<FontPreferences> => {
		const result = await db
			.select({
				systemFont: schema.preferenciasUsuario.systemFont,
				moneyFont: schema.preferenciasUsuario.moneyFont,
			})
			.from(schema.preferenciasUsuario)
			.where(eq(schema.preferenciasUsuario.userId, userId))
			.limit(1);

		if (!result[0]) return DEFAULT_FONT_PREFS;

		return {
			systemFont: normalizeFontKey(result[0].systemFont),
			moneyFont: normalizeFontKey(result[0].moneyFont),
		};
	},
);
