import { RiArrowRightSLine } from "@remixicon/react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ChangelogTab } from "@/components/ajustes/changelog-tab";
import { CompanionTab } from "@/components/ajustes/companion-tab";
import { DeleteAccountForm } from "@/components/ajustes/delete-account-form";
import { PreferencesForm } from "@/components/ajustes/preferences-form";
import { UpdateEmailForm } from "@/components/ajustes/update-email-form";
import { UpdateNameForm } from "@/components/ajustes/update-name-form";
import { UpdatePasswordForm } from "@/components/ajustes/update-password-form";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/config";
import { parseChangelog } from "@/lib/changelog/parse-changelog";

import { fetchAjustesPageData } from "./data";

export default async function Page() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	const userName = session.user.name || "";
	const userEmail = session.user.email || "";

	const { authProvider, userPreferences, userApiTokens } =
		await fetchAjustesPageData(session.user.id);

	const changelogVersions = parseChangelog();

	return (
		<div className="w-full">
			<Tabs defaultValue="preferencias" className="w-full">
				{/* No mobile: rolagem horizontal + seta indicando mais opções à direita */}
				<div className="relative -mx-6 px-6 md:mx-0 md:px-0">
					<div className="overflow-x-auto overflow-y-hidden scroll-smooth md:overflow-visible [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						<TabsList className="inline-flex w-max flex-nowrap md:w-full">
							<TabsTrigger value="preferencias">Preferências</TabsTrigger>
							<TabsTrigger value="companion">Companion</TabsTrigger>
							<TabsTrigger value="nome">Alterar nome</TabsTrigger>
							<TabsTrigger value="senha">Alterar senha</TabsTrigger>
							<TabsTrigger value="email">Alterar e-mail</TabsTrigger>
							<TabsTrigger value="changelog">Changelog</TabsTrigger>
							<TabsTrigger value="deletar" className="text-destructive">
								Deletar conta
							</TabsTrigger>
						</TabsList>
					</div>
					<div
						className="pointer-events-none absolute right-0 top-0 hidden h-9 w-10 items-center justify-end bg-gradient-to-l from-background to-transparent md:hidden"
						aria-hidden
					>
						<RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
					</div>
				</div>

				<TabsContent value="preferencias" className="mt-4">
					<Card className="p-6">
						<div className="space-y-4">
							<div>
								<h2 className="text-lg font-bold mb-1">Preferências</h2>
								<p className="text-sm text-muted-foreground mb-4">
									Personalize sua experiência no OpenMonetis ajustando as
									configurações de acordo com suas necessidades.
								</p>
							</div>
							<PreferencesForm
								disableMagnetlines={
									userPreferences?.disableMagnetlines ?? false
								}
								extratoNoteAsColumn={
									userPreferences?.extratoNoteAsColumn ?? false
								}
								lancamentosColumnOrder={
									userPreferences?.lancamentosColumnOrder ?? null
								}
								systemFont={userPreferences?.systemFont ?? "ai-sans"}
								moneyFont={userPreferences?.moneyFont ?? "ai-sans"}
							/>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="companion" className="mt-4">
					<CompanionTab tokens={userApiTokens} />
				</TabsContent>

				<TabsContent value="nome" className="mt-4">
					<Card className="p-6">
						<div className="space-y-4">
							<div>
								<h2 className="text-lg font-bold mb-1">Alterar nome</h2>
								<p className="text-sm text-muted-foreground mb-4">
									Atualize como seu nome aparece no OpenMonetis. Esse nome pode
									ser exibido em diferentes seções do app e em comunicações.
								</p>
							</div>
							<UpdateNameForm currentName={userName} />
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="senha" className="mt-4">
					<Card className="p-6">
						<div className="space-y-4">
							<div>
								<h2 className="text-lg font-bold mb-1">Alterar senha</h2>
								<p className="text-sm text-muted-foreground mb-4">
									Defina uma nova senha para sua conta. Guarde-a em local
									seguro.
								</p>
							</div>
							<UpdatePasswordForm authProvider={authProvider} />
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="email" className="mt-4">
					<Card className="p-6">
						<div className="space-y-4">
							<div>
								<h2 className="text-lg font-bold mb-1">Alterar e-mail</h2>
								<p className="text-sm text-muted-foreground mb-4">
									Atualize o e-mail associado à sua conta. Você precisará
									confirmar os links enviados para o novo e também para o e-mail
									atual (quando aplicável) para concluir a alteração.
								</p>
							</div>
							<UpdateEmailForm
								currentEmail={userEmail}
								authProvider={authProvider}
							/>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="changelog" className="mt-4">
					<ChangelogTab versions={changelogVersions} />
				</TabsContent>

				<TabsContent value="deletar" className="mt-4">
					<Card className="p-6">
						<div className="space-y-4">
							<div>
								<h2 className="text-lg font-bold mb-1 text-destructive">
									Deletar conta
								</h2>
								<p className="text-sm text-muted-foreground mb-4">
									Ao prosseguir, sua conta e todos os dados associados serão
									excluídos de forma irreversível.
								</p>
							</div>
							<DeleteAccountForm />
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
