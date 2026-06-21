import { and, desc, eq } from "drizzle-orm";
import { attachments, type Note, noteAttachments, notes } from "@/db/schema";
import { db } from "@/shared/lib/db";

export type NoteAttachmentData = {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
};

type Task = {
	id: string;
	text: string;
	completed: boolean;
};

type NoteData = {
	id: string;
	title: string;
	description: string;
	type: "nota" | "tarefa";
	tasks?: Task[];
	archived: boolean;
	createdAt: string;
	attachments: NoteAttachmentData[];
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

function toNoteData(
	note: Note,
	linkedAttachments: NoteAttachmentData[],
): NoteData {
	return {
		id: note.id,
		title: (note.title ?? "").trim(),
		description: (note.description ?? "").trim(),
		type: (note.type ?? "nota") as "nota" | "tarefa",
		tasks: parseTasks(note.tasks),
		archived: note.archived,
		createdAt: note.createdAt.toISOString(),
		attachments: linkedAttachments,
	};
}

export async function fetchAllNotesForUser(
	userId: string,
): Promise<{ activeNotes: NoteData[]; archivedNotes: NoteData[] }> {
	const [noteRows, attachmentRows] = await Promise.all([
		db.query.notes.findMany({
			where: eq(notes.userId, userId),
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		}),
		db
			.select({
				noteId: noteAttachments.noteId,
				attachmentId: attachments.id,
				fileName: attachments.fileName,
				fileSize: attachments.fileSize,
				mimeType: attachments.mimeType,
			})
			.from(noteAttachments)
			.innerJoin(
				notes,
				and(eq(noteAttachments.noteId, notes.id), eq(notes.userId, userId)),
			)
			.innerJoin(
				attachments,
				and(
					eq(noteAttachments.attachmentId, attachments.id),
					eq(attachments.userId, userId),
				),
			)
			.orderBy(desc(attachments.createdAt)),
	]);

	const attachmentsByNote = new Map<string, NoteAttachmentData[]>();
	for (const { noteId, ...attachment } of attachmentRows) {
		const current = attachmentsByNote.get(noteId) ?? [];
		current.push(attachment);
		attachmentsByNote.set(noteId, current);
	}
	const mapped = noteRows.map((note) =>
		toNoteData(note, attachmentsByNote.get(note.id) ?? []),
	);

	return {
		activeNotes: mapped.filter((note) => !note.archived),
		archivedNotes: mapped.filter((note) => note.archived),
	};
}
