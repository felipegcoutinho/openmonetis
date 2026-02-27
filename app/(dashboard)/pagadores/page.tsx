import { PagadoresPage } from "@/components/pagadores/pagadores-page";
import { getUserId } from "@/lib/auth/server";
import { fetchPagadoresForUser } from "./data";

export default async function Page() {
	const userId = await getUserId();
	const { pagadores, avatarOptions } = await fetchPagadoresForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<PagadoresPage pagadores={pagadores} avatarOptions={avatarOptions} />
		</main>
	);
}
