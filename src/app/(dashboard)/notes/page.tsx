import { connection } from "next/server";
import { NotesPage } from "@/features/notes/components/notes-page";
import { fetchAllNotesForUser } from "@/features/notes/queries";
import { fetchUserPreferences } from "@/features/settings/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const [{ activeNotes, archivedNotes }, preferences] = await Promise.all([
		fetchAllNotesForUser(userId),
		fetchUserPreferences(userId),
	]);

	return (
		<main className="flex flex-col gap-6">
			<NotesPage
				notes={activeNotes}
				archivedNotes={archivedNotes}
				attachmentMaxSizeMb={preferences?.attachmentMaxSizeMb ?? 50}
			/>
		</main>
	);
}
