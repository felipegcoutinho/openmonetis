import { and, eq } from "drizzle-orm";
import { type Note, notes } from "@/db/schema";
import { db } from "@/shared/lib/db";

export type Task = {
	id: string;
	text: string;
	completed: boolean;
};

export type NoteData = {
	id: string;
	title: string;
	description: string;
	type: "nota" | "tarefa";
	tasks?: Task[];
	archived: boolean;
	createdAt: string;
};

function parseTasks(value: string | null): Task[] | undefined {
	if (!value) {
		return undefined;
	}

	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

function toNoteData(note: Note): NoteData {
	return {
		id: note.id,
		title: (note.title ?? "").trim(),
		description: (note.description ?? "").trim(),
		type: (note.type ?? "nota") as "nota" | "tarefa",
		tasks: parseTasks(note.tasks),
		archived: note.archived,
		createdAt: note.createdAt.toISOString(),
	};
}

export async function fetchNotesForUser(userId: string): Promise<NoteData[]> {
	const noteRows = await db.query.notes.findMany({
		where: and(eq(notes.userId, userId), eq(notes.archived, false)),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	});

	return noteRows.map(toNoteData);
}

export async function fetchAllNotesForUser(
	userId: string,
): Promise<{ activeNotes: NoteData[]; archivedNotes: NoteData[] }> {
	const [activeNotes, archivedNotes] = await Promise.all([
		fetchNotesForUser(userId),
		fetchArchivedForUser(userId),
	]);

	return { activeNotes, archivedNotes };
}

export async function fetchArchivedForUser(
	userId: string,
): Promise<NoteData[]> {
	const noteRows = await db.query.notes.findMany({
		where: and(eq(notes.userId, userId), eq(notes.archived, true)),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	});

	return noteRows.map(toNoteData);
}
