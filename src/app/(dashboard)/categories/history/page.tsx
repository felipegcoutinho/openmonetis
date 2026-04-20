import { connection } from "next/server";
import { fetchCategoryHistory } from "@/features/dashboard/categories/category-history-queries";
import { CategoryHistoryWidget } from "@/features/dashboard/components/widgets/category-history-widget";
import { getUser } from "@/shared/lib/auth/server";
import { getCurrentPeriod } from "@/shared/utils/period";

export default async function HistoricoCategoriasPage() {
	await connection();
	const user = await getUser();
	const currentPeriod = getCurrentPeriod();

	const data = await fetchCategoryHistory(user.id, currentPeriod);

	return (
		<main>
			<CategoryHistoryWidget data={data} />
		</main>
	);
}
