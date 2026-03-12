import { PagadoresPage } from "@/features/payers/components/payers-page";
import { fetchPagadoresForUser } from "@/features/payers/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	const userId = await getUserId();
	const { pagadores, avatarOptions } = await fetchPagadoresForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<PagadoresPage pagadores={pagadores} avatarOptions={avatarOptions} />
		</main>
	);
}
