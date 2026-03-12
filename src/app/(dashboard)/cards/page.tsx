import { CardsPage } from "@/features/cards/components/cards-page";
import { fetchAllCardsForUser } from "@/features/cards/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	const userId = await getUserId();
	const { activeCards, archivedCards, accounts, logoOptions } =
		await fetchAllCardsForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<CardsPage
				cards={activeCards}
				archivedCards={archivedCards}
				accounts={accounts}
				logoOptions={logoOptions}
			/>
		</main>
	);
}
