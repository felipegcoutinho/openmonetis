import { InboxPage } from "@/features/inbox/components/inbox-page";
import {
	fetchAppLogoMap,
	fetchInboxDialogData,
	fetchInboxItems,
} from "@/features/inbox/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	const userId = await getUserId();

	const [pendingItems, processedItems, discardedItems, dialogData, appLogoMap] =
		await Promise.all([
			fetchInboxItems(userId, "pending"),
			fetchInboxItems(userId, "processed"),
			fetchInboxItems(userId, "discarded"),
			fetchInboxDialogData(userId),
			fetchAppLogoMap(userId),
		]);

	return (
		<main className="flex flex-col items-start gap-6">
			<InboxPage
				pendingItems={pendingItems}
				processedItems={processedItems}
				discardedItems={discardedItems}
				pagadorOptions={dialogData.pagadorOptions}
				splitPagadorOptions={dialogData.splitPagadorOptions}
				defaultPagadorId={dialogData.defaultPagadorId}
				contaOptions={dialogData.contaOptions}
				cartaoOptions={dialogData.cartaoOptions}
				categoriaOptions={dialogData.categoriaOptions}
				estabelecimentos={dialogData.estabelecimentos}
				appLogoMap={appLogoMap}
			/>
		</main>
	);
}
