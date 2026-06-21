type NoteType = "nota" | "tarefa";

export interface Task {
	id: string;
	text: string;
	completed: boolean;
}

export interface Note {
	id: string;
	title: string;
	description: string;
	type: NoteType;
	tasks?: Task[];
	archived: boolean;
	createdAt: string;
	attachments: NoteAttachment[];
}

export interface NoteAttachment {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
}

export interface NoteFormValues {
	title: string;
	description: string;
	type: NoteType;
	tasks?: Task[];
}

/** Ordena tarefas: pendentes primeiro, concluídas por último. */
export function sortTasksByStatus(tasks: Task[]): Task[] {
	return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
}
