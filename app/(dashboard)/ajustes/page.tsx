import { DeleteAccountForm } from "@/components/ajustes/delete-account-form";
import { UpdateEmailForm } from "@/components/ajustes/update-email-form";
import { UpdateNameForm } from "@/components/ajustes/update-name-form";
import { UpdatePasswordForm } from "@/components/ajustes/update-password-form";
import { PreferencesForm } from "@/components/ajustes/preferences-form";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/config";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const userName = session.user.name || "";
  const userEmail = session.user.email || "";

  // Detectar método de autenticação (Google OAuth vs E-mail/Senha)
  const userAccount = await db.query.account.findFirst({
    where: eq(schema.account.userId, session.user.id),
  });

  // Buscar preferências do usuário
  const userPreferencesResult = await db
    .select({
      disableMagnetlines: schema.userPreferences.disableMagnetlines,
    })
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.userId, session.user.id))
    .limit(1);

  const userPreferences = userPreferencesResult[0] || null;

  // Se o providerId for "google", o usuário usa Google OAuth
  const authProvider = userAccount?.providerId || "credential";

  return (
    <div className="w-full">
      <Tabs defaultValue="preferencias" className="w-full">
        <TabsList>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="nome">Alterar nome</TabsTrigger>
          <TabsTrigger value="senha">Alterar senha</TabsTrigger>
          <TabsTrigger value="email">Alterar e-mail</TabsTrigger>
          <TabsTrigger value="deletar" className="text-destructive">
            Deletar conta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferencias" className="mt-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Preferências</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Personalize sua experiência no Opensheets ajustando as
                  configurações de acordo com suas necessidades.
                </p>
              </div>
              <PreferencesForm
                disableMagnetlines={
                  userPreferences?.disableMagnetlines ?? false
                }
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="nome" className="mt-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Alterar nome</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Atualize como seu nome aparece no Opensheets. Esse nome pode
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
