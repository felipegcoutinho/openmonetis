import { NotesPage } from "@/features/notes/components/notes-page";
import { fetchAllNotesForUser } from "@/features/notes/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	const userId = await getUserId();
	const { activeNotes, archivedNotes } = await fetchAllNotesForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<NotesPage notes={activeNotes} archivedNotes={archivedNotes} />
		</main>
	);
}
