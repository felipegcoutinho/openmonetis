"use client";

import { RiCheckLine } from "@remixicon/react";
import {
	buildNoteDisplayTitle,
	formatNoteCreatedAtLong,
} from "@/features/notes/lib/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
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
}

export function NoteDetailsDialog({
	note,
	open,
	onOpenChange,
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
					<Card className="max-h-[320px] overflow-auto gap-2 p-2">
						{sortedTasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center gap-3 px-3 py-1.5 space-y-1 rounded-md hover:bg-muted/50"
							>
								<div
									className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
										task.completed
											? "bg-success border-success"
											: "border-input"
									}`}
								>
									{task.completed && (
										<RiCheckLine className="h-4 w-4 text-primary-foreground" />
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
					</Card>
				) : (
					<div className="max-h-[320px] overflow-auto whitespace-pre-line wrap-break-word text-sm text-foreground">
						{note.description}
					</div>
				)}

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="outline">
							Fechar
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
