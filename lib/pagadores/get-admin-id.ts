import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { pagadores } from "@/db/schema";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";

/**
 * Returns the admin pagador ID for a user (cached per request via React.cache).
 * Eliminates the need for JOIN with pagadores in ~20 dashboard queries.
 */
export const getAdminPagadorId = cache(
	async (userId: string): Promise<string | null> => {
		const [row] = await db
			.select({ id: pagadores.id })
			.from(pagadores)
			.where(
				and(
					eq(pagadores.userId, userId),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				),
			)
			.limit(1);
		return row?.id ?? null;
	},
);
