"use client";

import { RiFileList2Line, RiPencilLine, RiTodoLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { NoteDetailsDialog } from "@/components/anotacoes/note-details-dialog";
import { NoteDialog } from "@/components/anotacoes/note-dialog";
import type { Note } from "@/components/anotacoes/types";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import type { DashboardNote } from "@/lib/dashboard/notes";
import { Badge } from "../ui/badge";
import { WidgetEmptyState } from "../widget-empty-state";

type NotesWidgetProps = {
	notes: DashboardNote[];
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const buildDisplayTitle = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length ? trimmed : "Anotação sem título";
};

const mapDashboardNoteToNote = (note: DashboardNote): Note => ({
	id: note.id,
	title: note.title,
	description: note.description,
	type: note.type,
	tasks: note.tasks,
	arquivada: note.arquivada,
	createdAt: note.createdAt,
});

const getTasksSummary = (note: DashboardNote) => {
	if (note.type !== "tarefa") {
		return "Nota";
	}

	const tasks = note.tasks ?? [];
	const completed = tasks.filter((task) => task.completed).length;
	return `${completed}/${tasks.length} concluídas`;
};

export function NotesWidget({ notes }: NotesWidgetProps) {
	const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [noteDetails, setNoteDetails] = useState<Note | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const mappedNotes = useMemo(() => notes.map(mapDashboardNoteToNote), [notes]);

	const handleOpenEdit = useCallback((note: Note) => {
		setNoteToEdit(note);
		setIsEditOpen(true);
	}, []);

	const handleOpenDetails = useCallback((note: Note) => {
		setNoteDetails(note);
		setIsDetailsOpen(true);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setIsEditOpen(open);
		if (!open) {
			setNoteToEdit(null);
		}
	}, []);

	const handleDetailsOpenChange = useCallback((open: boolean) => {
		setIsDetailsOpen(open);
		if (!open) {
			setNoteDetails(null);
		}
	}, []);

	return (
		<>
			<CardContent className="flex flex-col gap-4 px-0">
				{mappedNotes.length === 0 ? (
					<WidgetEmptyState
						icon={<RiTodoLine className="size-6 text-muted-foreground" />}
						title="Nenhuma anotação ativa"
						description="Crie anotações para acompanhar lembretes e tarefas financeiras."
					/>
				) : (
					<ul className="flex flex-col">
						{mappedNotes.map((note) => (
							<li
								key={note.id}
								className="flex items-center justify-between gap-2 border-b border-dashed py-2 last:border-b-0 last:pb-0"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-foreground">
										{buildDisplayTitle(note.title)}
									</p>
									<div className="mt-1 flex items-center gap-2">
										<Badge variant="outline" className="h-5 px-1.5 text-[10px]">
											{getTasksSummary(note)}
										</Badge>
										<p className="truncate text-[11px] text-muted-foreground">
											{DATE_FORMATTER.format(new Date(note.createdAt))}
										</p>
									</div>
								</div>

								<div className="flex shrink-0 items-center">
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => handleOpenEdit(note)}
										aria-label={`Editar anotação ${buildDisplayTitle(note.title)}`}
									>
										<RiPencilLine className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => handleOpenDetails(note)}
										aria-label={`Ver detalhes da anotação ${buildDisplayTitle(
											note.title,
										)}`}
									>
										<RiFileList2Line className="size-4" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<NoteDialog
				mode="update"
				note={noteToEdit ?? undefined}
				open={isEditOpen}
				onOpenChange={handleEditOpenChange}
			/>

			<NoteDetailsDialog
				note={noteDetails}
				open={isDetailsOpen}
				onOpenChange={handleDetailsOpenChange}
			/>
		</>
	);
}
