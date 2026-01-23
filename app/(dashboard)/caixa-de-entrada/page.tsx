import { InboxPage } from "@/components/caixa-de-entrada/inbox-page";
import { getUserId } from "@/lib/auth/server";
import {
  fetchInboxItems,
  fetchCategoriasForSelect,
  fetchContasForSelect,
  fetchCartoesForSelect,
} from "./data";

export default async function Page() {
  const userId = await getUserId();

  const [items, categorias, contas, cartoes] = await Promise.all([
    fetchInboxItems(userId, "pending"),
    fetchCategoriasForSelect(userId),
    fetchContasForSelect(userId),
    fetchCartoesForSelect(userId),
  ]);

  return (
    <main className="flex flex-col items-start gap-6">
      <InboxPage
        items={items}
        categorias={categorias}
        contas={contas}
        cartoes={cartoes}
      />
    </main>
  );
}
