import { CategoriesPage } from "@/features/categories/components/categories-page";
import { fetchCategoriesForUser } from "@/features/categories/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	const userId = await getUserId();
	const categories = await fetchCategoriesForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<CategoriesPage categories={categories} />
		</main>
	);
}
