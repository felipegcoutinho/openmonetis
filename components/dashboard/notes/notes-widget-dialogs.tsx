import { NoteDetailsDialog } from "@/components/anotacoes/note-details-dialog";
import { NoteDialog } from "@/components/anotacoes/note-dialog";
import type { Note } from "@/components/anotacoes/types";

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
