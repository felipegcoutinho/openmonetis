import type { Note } from "@/components/anotacoes/types";
import { NotesList } from "./notes-list";
import { NotesWidgetDialogs } from "./notes-widget-dialogs";

type NotesWidgetViewProps = {
	notes: Note[];
	noteToEdit: Note | null;
	isEditOpen: boolean;
	noteDetails: Note | null;
	isDetailsOpen: boolean;
	onOpenEdit: (note: Note) => void;
	onOpenDetails: (note: Note) => void;
	onEditOpenChange: (open: boolean) => void;
	onDetailsOpenChange: (open: boolean) => void;
};

export function NotesWidgetView({
	notes,
	noteToEdit,
	isEditOpen,
	noteDetails,
	isDetailsOpen,
	onOpenEdit,
	onOpenDetails,
	onEditOpenChange,
	onDetailsOpenChange,
}: NotesWidgetViewProps) {
	return (
		<>
			<div className="flex flex-col gap-4 px-0">
				<NotesList
					notes={notes}
					onOpenEdit={onOpenEdit}
					onOpenDetails={onOpenDetails}
				/>
			</div>

			<NotesWidgetDialogs
				noteToEdit={noteToEdit}
				isEditOpen={isEditOpen}
				noteDetails={noteDetails}
				isDetailsOpen={isDetailsOpen}
				onEditOpenChange={onEditOpenChange}
				onDetailsOpenChange={onDetailsOpenChange}
			/>
		</>
	);
}
