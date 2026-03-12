type NoteTasksSummaryInput = {
	type: string;
	tasks?: Array<{ completed: boolean }> | null;
};

const NOTE_CREATED_AT_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "medium",
});

const NOTE_CREATED_AT_LONG_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "long",
	timeStyle: "short",
});

const parseNoteDate = (value: string | Date | null | undefined) => {
	if (!value) {
		return null;
	}

	const parsed = value instanceof Date ? value : new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const buildNoteDisplayTitle = (value: string | null | undefined) => {
	const trimmed = value?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : "Anotação sem título";
};

export const getNoteTasksSummary = (note: NoteTasksSummaryInput) => {
	if (note.type !== "tarefa") {
		return "Nota";
	}

	const tasks = note.tasks ?? [];
	const completed = tasks.filter((task) => task.completed).length;
	return `${completed}/${tasks.length} concluídas`;
};

export const formatNoteCreatedAt = (
	value: string | Date | null | undefined,
) => {
	const parsed = parseNoteDate(value);
	return parsed ? NOTE_CREATED_AT_FORMATTER.format(parsed) : null;
};

export const formatNoteCreatedAtLong = (
	value: string | Date | null | undefined,
) => {
	const parsed = parseNoteDate(value);
	return parsed ? NOTE_CREATED_AT_LONG_FORMATTER.format(parsed) : null;
};
