import { InstallmentAnalysisPage } from "@/components/dashboard/installment-analysis/installment-analysis-page";
import { getUser } from "@/lib/auth/server";
import { fetchInstallmentAnalysis } from "@/lib/dashboard/expenses/installment-analysis";

export default async function Page() {
  const user = await getUser();
  const data = await fetchInstallmentAnalysis(user.id);

  return (
    <main className="flex flex-col gap-4 pb-8">
      <InstallmentAnalysisPage data={data} />
    </main>
  );
}
