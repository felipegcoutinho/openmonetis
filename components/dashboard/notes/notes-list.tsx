import { RiTodoLine } from "@remixicon/react";
import type { Note } from "@/components/anotacoes/types";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import { NoteListItem } from "./note-list-item";

type NotesListProps = {
	notes: Note[];
	onOpenEdit: (note: Note) => void;
	onOpenDetails: (note: Note) => void;
};

export function NotesList({
	notes,
	onOpenEdit,
	onOpenDetails,
}: NotesListProps) {
	if (notes.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiTodoLine className="size-6 text-muted-foreground" />}
				title="Nenhuma anotação ativa"
				description="Crie anotações para acompanhar lembretes e tarefas financeiras."
			/>
		);
	}

	return (
		<ul className="flex flex-col">
			{notes.map((note) => (
				<NoteListItem
					key={note.id}
					note={note}
					onOpenEdit={onOpenEdit}
					onOpenDetails={onOpenDetails}
				/>
			))}
		</ul>
	);
}
