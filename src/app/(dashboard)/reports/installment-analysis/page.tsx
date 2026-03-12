import { InstallmentAnalysisPage } from "@/features/dashboard/components/installment-analysis/installment-analysis-page";
import { fetchInstallmentAnalysis } from "@/features/dashboard/expenses/installment-analysis-queries";
import { getUser } from "@/shared/lib/auth/server";

export default async function Page() {
	const user = await getUser();
	const data = await fetchInstallmentAnalysis(user.id);

	return (
		<main className="flex flex-col gap-4 pb-8">
			<InstallmentAnalysisPage data={data} />
		</main>
	);
}
