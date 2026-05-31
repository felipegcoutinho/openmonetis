import {
	RiCalendarLine,
	RiFileList2Line,
	RiPencilLine,
} from "@remixicon/react";
import type { Note } from "@/features/notes/components/types";
import {
	buildNoteDisplayTitle,
	formatNoteCreatedAt,
	getNoteTasksSummary,
} from "@/features/notes/lib/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";

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
	const isTask = note.type === "tarefa";

	return (
		<li className="group flex items-center justify-between gap-2 py-1.5 transition-all duration-300">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-foreground">
					{displayTitle}
				</p>
				<div className="mt-1 flex min-w-0 items-center gap-2">
					{isTask ? (
						<Badge variant="outline" className="h-5 px-1.5 text-xs">
							{getNoteTasksSummary(note)}
						</Badge>
					) : null}
					<p className="truncate text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1">
							<RiCalendarLine className="size-3.5 shrink-0" />
							{createdAtLabel}
						</span>
					</p>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-0.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-primary/70 opacity-70 transition-all hover:text-primary hover:opacity-100 focus-visible:text-primary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
							onClick={() => onOpenEdit(note)}
							aria-label={`Editar anotação ${displayTitle}`}
						>
							<RiPencilLine className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">Editar anotação</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-primary/70 opacity-70 transition-all hover:text-primary hover:opacity-100 focus-visible:text-primary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
							onClick={() => onOpenDetails(note)}
							aria-label={`Ver detalhes da anotação ${displayTitle}`}
						>
							<RiFileList2Line className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">Ver detalhes</TooltipContent>
				</Tooltip>
			</div>
		</li>
	);
}
