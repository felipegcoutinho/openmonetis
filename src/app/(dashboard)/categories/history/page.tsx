import { fetchCategoryHistory } from "@/features/dashboard/categories/category-history-queries";
import { CategoryHistoryWidget } from "@/features/dashboard/components/category-history-widget";
import { getUser } from "@/shared/lib/auth/server";
import { getCurrentPeriod } from "@/shared/utils/period";

export default async function HistoricoCategoriasPage() {
	const user = await getUser();
	const currentPeriod = getCurrentPeriod();

	const data = await fetchCategoryHistory(user.id, currentPeriod);

	return (
		<main>
			<CategoryHistoryWidget data={data} />
		</main>
	);
}
