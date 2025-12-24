import { NotesPage } from "@/components/anotacoes/notes-page";
import { getUserId } from "@/lib/auth/server";
import { fetchArquivadasForUser } from "../data";

export default async function ArquivadasPage() {
  const userId = await getUserId();
  const notes = await fetchArquivadasForUser(userId);

  return (
    <main className="flex flex-col items-start gap-6">
      <NotesPage notes={notes} isArquivadas={true} />
    </main>
  );
}
