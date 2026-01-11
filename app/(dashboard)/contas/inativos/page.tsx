import { AccountsPage } from "@/components/contas/accounts-page";
import { getUserId } from "@/lib/auth/server";
import { fetchInativosForUser } from "../data";

export default async function InativosPage() {
  const userId = await getUserId();
  const { accounts, logoOptions } = await fetchInativosForUser(userId);

  return (
    <main className="flex flex-col items-start gap-6">
      <AccountsPage accounts={accounts} logoOptions={logoOptions} isInativos={true} />
    </main>
  );
}
