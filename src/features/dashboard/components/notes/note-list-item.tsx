import { RiFileList2Line, RiPencilLine } from "@remixicon/react";
import type { Note } from "@/features/notes/components/types";
import {
	buildNoteDisplayTitle,
	formatNoteCreatedAt,
	getNoteTasksSummary,
} from "@/features/notes/lib/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

type NoteListItemProps = {
	note: Note;
	onOpenEdit: (note: Note) => void;
	onOpenDetails: (note: Note) => void;
};

export function NoteListItem({
	note,
	onOpenEdit,
	onOpenDetails,
}: NoteListItemProps) {
	const displayTitle = buildNoteDisplayTitle(note.title);
	const createdAtLabel = formatNoteCreatedAt(note.createdAt);

	return (
		<div className="group flex items-center justify-between gap-2 transition-all duration-300 py-2">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-foreground">
					{displayTitle}
				</p>
				<div className="mt-1 flex items-center gap-2">
					<Badge variant="outline" className="h-5 px-1.5 text-xs">
						{getNoteTasksSummary(note)}
					</Badge>
					<p className="truncate text-xs text-muted-foreground">
						{createdAtLabel}
					</p>
				</div>
			</div>

			<div className="flex shrink-0 items-center">
				<Button
					variant="link"
					size="icon-sm"
					className="transition-opacity text-primary hover:opacity-80"
					onClick={() => onOpenEdit(note)}
					aria-label={`Editar anotação ${displayTitle}`}
				>
					<RiPencilLine className="size-4" />
				</Button>
				<Button
					variant="link"
					size="icon-sm"
					className="transition-opacity text-primary hover:opacity-80"
					onClick={() => onOpenDetails(note)}
					aria-label={`Ver detalhes da anotação ${displayTitle}`}
				>
					<RiFileList2Line className="size-4" />
				</Button>
			</div>
		</div>
	);
}
