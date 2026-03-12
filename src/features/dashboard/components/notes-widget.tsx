"use client";

import type { DashboardNote } from "@/features/dashboard/notes-queries";
import { useNotesWidgetController } from "@/features/dashboard/use-notes-widget-controller";
import { NotesWidgetView } from "./notes/notes-widget-view";

type NotesWidgetProps = {
	notes: DashboardNote[];
};

export function NotesWidget({ notes }: NotesWidgetProps) {
	const {
		mappedNotes,
		noteToEdit,
		isEditOpen,
		noteDetails,
		isDetailsOpen,
		openEdit,
		openDetails,
		handleEditOpenChange,
		handleDetailsOpenChange,
	} = useNotesWidgetController(notes);

	return (
		<NotesWidgetView
			notes={mappedNotes}
			noteToEdit={noteToEdit}
			isEditOpen={isEditOpen}
			noteDetails={noteDetails}
			isDetailsOpen={isDetailsOpen}
			onOpenEdit={openEdit}
			onOpenDetails={openDetails}
			onEditOpenChange={handleEditOpenChange}
			onDetailsOpenChange={handleDetailsOpenChange}
		/>
	);
}
