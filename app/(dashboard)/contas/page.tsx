import { AccountsPage } from "@/components/contas/accounts-page";
import { getUserId } from "@/lib/auth/server";
import { fetchAccountsForUser } from "./data";

export default async function Page() {
  const userId = await getUserId();
  const now = new Date();

  const { accounts, logoOptions } = await fetchAccountsForUser(userId);

  return (
    <main className="flex flex-col items-start gap-6">
      <AccountsPage accounts={accounts} logoOptions={logoOptions} />
    </main>
  );
}
