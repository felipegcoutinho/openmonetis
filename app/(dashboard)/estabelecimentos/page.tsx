import { EstabelecimentosPage } from "@/components/estabelecimentos/estabelecimentos-page";
import { getUserId } from "@/lib/auth/server";
import { fetchEstabelecimentosForUser } from "./data";

export default async function Page() {
	const userId = await getUserId();
	const rows = await fetchEstabelecimentosForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<EstabelecimentosPage rows={rows} />
		</main>
	);
}
