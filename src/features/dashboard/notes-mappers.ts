import type { DashboardNote } from "@/features/dashboard/notes-queries";
import type { Note } from "@/features/notes/components/types";

export const mapDashboardNoteToNote = (note: DashboardNote): Note => ({
	id: note.id,
	title: note.title,
	description: note.description,
	type: note.type,
	tasks: note.tasks,
	arquivada: note.arquivada,
	createdAt: note.createdAt,
});

export const mapDashboardNotesToNotes = (notes: DashboardNote[]) =>
	notes.map(mapDashboardNoteToNote);
