import { CardsPage } from "@/components/cartoes/cards-page";
import { getUserId } from "@/lib/auth/server";
import { fetchInativosForUser } from "../data";

export default async function InativosPage() {
  const userId = await getUserId();
  const { cards, accounts, logoOptions } = await fetchInativosForUser(userId);

  return (
    <main className="flex flex-col items-start gap-6">
      <CardsPage
        cards={cards}
        accounts={accounts}
        logoOptions={logoOptions}
        isInativos={true}
      />
    </main>
  );
}
