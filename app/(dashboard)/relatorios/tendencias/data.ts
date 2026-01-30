import { asc, eq } from "drizzle-orm";
import { type Categoria, categorias } from "@/db/schema";
import { db } from "@/lib/db";

export async function fetchUserCategories(
	userId: string,
): Promise<Categoria[]> {
	return db.query.categorias.findMany({
		where: eq(categorias.userId, userId),
		orderBy: [asc(categorias.name)],
	});
}
