import type { Note } from "@/components/anotacoes/types";
import type { DashboardNote } from "@/lib/dashboard/notes";

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
