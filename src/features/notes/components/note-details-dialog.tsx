"use client";

import { RiCheckLine } from "@remixicon/react";
import {
	buildNoteDisplayTitle,
	formatNoteCreatedAtLong,
} from "@/features/notes/lib/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { type Note, sortTasksByStatus } from "./types";

interface NoteDetailsDialogProps {
	note: Note | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit?: (note: Note) => void;
}

export function NoteDetailsDialog({
	note,
	open,
	onOpenChange,
	onEdit,
}: NoteDetailsDialogProps) {
	if (!note) {
		return null;
	}

	const formattedDate = formatNoteCreatedAtLong(note.createdAt) ?? "";
	const displayTitle = buildNoteDisplayTitle(note.title);
	const tasks = note.tasks || [];
	const sortedTasks = sortTasksByStatus(tasks);
	const isTask = note.type === "tarefa";
	const completedCount = tasks.filter((t) => t.completed).length;
	const totalCount = tasks.length;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{displayTitle}
						{isTask && (
							<Badge variant="secondary" className="text-xs">
								{completedCount}/{totalCount}
							</Badge>
						)}
					</DialogTitle>
					<DialogDescription>{formattedDate}</DialogDescription>
				</DialogHeader>

				{isTask ? (
					<div className="max-h-[320px] overflow-auto rounded-md border p-1">
						{sortedTasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center gap-3 rounded-md px-3 py-1.5"
							>
								<div className="flex h-4 w-4 shrink-0 items-center justify-center">
									{task.completed ? (
										<RiCheckLine className="h-4 w-4 text-success" />
									) : (
										<div className="h-4 w-4 rounded-sm border border-input" />
									)}
								</div>
								<span
									className={`text-sm ${
										task.completed
											? "text-muted-foreground line-through"
											: "text-foreground"
									}`}
								>
									{task.text}
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="max-h-[320px] overflow-auto whitespace-pre-line wrap-break-word text-sm text-foreground">
						{note.description}
					</div>
				)}

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="outline">
							Cancelar
						</Button>
					</DialogClose>
					{onEdit && (
						<Button
							type="button"
							onClick={() => {
								onOpenChange(false);
								onEdit(note);
							}}
						>
							Alterar
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
