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
		<li className="flex items-center justify-between gap-2 border-b border-dashed py-2 last:border-b-0 last:pb-0">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-foreground">
					{displayTitle}
				</p>
				<div className="mt-1 flex items-center gap-2">
					<Badge variant="outline" className="h-5 px-1.5 text-[10px]">
						{getNoteTasksSummary(note)}
					</Badge>
					{createdAtLabel ? (
						<p className="truncate text-[11px] text-muted-foreground">
							{createdAtLabel}
						</p>
					) : null}
				</div>
			</div>

			<div className="flex shrink-0 items-center">
				<Button
					variant="ghost"
					size="icon-sm"
					className="text-muted-foreground hover:text-foreground"
					onClick={() => onOpenEdit(note)}
					aria-label={`Editar anotação ${displayTitle}`}
				>
					<RiPencilLine className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					className="text-muted-foreground hover:text-foreground"
					onClick={() => onOpenDetails(note)}
					aria-label={`Ver detalhes da anotação ${displayTitle}`}
				>
					<RiFileList2Line className="size-4" />
				</Button>
			</div>
		</li>
	);
}
