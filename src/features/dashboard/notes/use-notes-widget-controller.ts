"use client";

import { useMemo, useState } from "react";
import { mapDashboardNotesToNotes } from "@/features/dashboard/notes/notes-mappers";
import type { DashboardNote } from "@/features/dashboard/notes/notes-queries";
import type { Note } from "@/features/notes/components/types";

type NotesWidgetController = {
	mappedNotes: Note[];
	noteToEdit: Note | null;
	isEditOpen: boolean;
	noteDetails: Note | null;
	isDetailsOpen: boolean;
	openEdit: (note: Note) => void;
	openDetails: (note: Note) => void;
	handleEditOpenChange: (open: boolean) => void;
	handleDetailsOpenChange: (open: boolean) => void;
};

export function useNotesWidgetController(
	notes: DashboardNote[],
): NotesWidgetController {
	const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [noteDetails, setNoteDetails] = useState<Note | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const mappedNotes = useMemo(() => mapDashboardNotesToNotes(notes), [notes]);

	const openEdit = (note: Note) => {
		setNoteToEdit(note);
		setIsEditOpen(true);
	};

	const openDetails = (note: Note) => {
		setNoteDetails(note);
		setIsDetailsOpen(true);
	};

	const handleEditOpenChange = (open: boolean) => {
		setIsEditOpen(open);
		if (!open) {
			setNoteToEdit(null);
		}
	};

	const handleDetailsOpenChange = (open: boolean) => {
		setIsDetailsOpen(open);
		if (!open) {
			setNoteDetails(null);
		}
	};

	return {
		mappedNotes,
		noteToEdit,
		isEditOpen,
		noteDetails,
		isDetailsOpen,
		openEdit,
		openDetails,
		handleEditOpenChange,
		handleDetailsOpenChange,
	};
}
