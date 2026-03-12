import { NoteDetailsDialog } from "@/features/notes/components/note-details-dialog";
import { NoteDialog } from "@/features/notes/components/note-dialog";
import type { Note } from "@/features/notes/components/types";

type NotesWidgetDialogsProps = {
	noteToEdit: Note | null;
	isEditOpen: boolean;
	noteDetails: Note | null;
	isDetailsOpen: boolean;
	onEditOpenChange: (open: boolean) => void;
	onDetailsOpenChange: (open: boolean) => void;
};

export function NotesWidgetDialogs({
	noteToEdit,
	isEditOpen,
	noteDetails,
	isDetailsOpen,
	onEditOpenChange,
	onDetailsOpenChange,
}: NotesWidgetDialogsProps) {
	return (
		<>
			<NoteDialog
				mode="update"
				note={noteToEdit ?? undefined}
				open={isEditOpen}
				onOpenChange={onEditOpenChange}
			/>

			<NoteDetailsDialog
				note={noteDetails}
				open={isDetailsOpen}
				onOpenChange={onDetailsOpenChange}
			/>
		</>
	);
}
