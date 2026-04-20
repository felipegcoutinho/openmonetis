import { eq } from "drizzle-orm";
import { type Category, categories } from "@/db/schema";
import type { CategoryType } from "@/shared/lib/categories/constants";
import { db } from "@/shared/lib/db";

export type CategoryData = {
	id: string;
	name: string;
	type: CategoryType;
	icon: string | null;
};

export async function fetchCategoriesForUser(
	userId: string,
): Promise<CategoryData[]> {
	const categoryRows = await db.query.categories.findMany({
		where: eq(categories.userId, userId),
	});

	return categoryRows.map((category: Category) => ({
		id: category.id,
		name: category.name,
		type: category.type as CategoryType,
		icon: category.icon,
	}));
}
