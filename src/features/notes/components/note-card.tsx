"use client";

import {
	RiArchiveLine,
	RiCheckLine,
	RiDeleteBin5Line,
	RiFileList2Line,
	RiInboxUnarchiveLine,
	RiPencilLine,
} from "@remixicon/react";
import {
	buildNoteDisplayTitle,
	formatNoteCreatedAt,
} from "@/features/notes/lib/formatters";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { type Note, sortTasksByStatus } from "./types";

interface NoteCardProps {
	note: Note;
	onEdit?: (note: Note) => void;
	onDetails?: (note: Note) => void;
	onRemove?: (note: Note) => void;
	onArquivar?: (note: Note) => void;
	isArquivadas?: boolean;
}

export function NoteCard({
	note,
	onEdit,
	onDetails,
	onRemove,
	onArquivar,
	isArquivadas = false,
}: NoteCardProps) {
	const displayTitle = buildNoteDisplayTitle(note.title);
	const createdAtLabel = formatNoteCreatedAt(note.createdAt);
	const isTask = note.type === "tarefa";
	const tasks = note.tasks || [];
	const sortedTasks = sortTasksByStatus(tasks);
	const completedCount = tasks.filter((t) => t.completed).length;
	const totalCount = tasks.length;

	const actions = [
		{
			label: "editar",
			icon: <RiPencilLine className="size-4" aria-hidden />,
			onClick: onEdit,
			destructive: false,
		},
		{
			label: "detalhes",
			icon: <RiFileList2Line className="size-4" aria-hidden />,
			onClick: onDetails,
			destructive: false,
		},
		{
			label: isArquivadas ? "desarquivar" : "arquivar",
			icon: isArquivadas ? (
				<RiInboxUnarchiveLine className="size-4" aria-hidden />
			) : (
				<RiArchiveLine className="size-4" aria-hidden />
			),
			onClick: onArquivar,
			destructive: false,
		},
		{
			label: "remover",
			icon: <RiDeleteBin5Line className="size-4" aria-hidden />,
			onClick: onRemove,
			destructive: true,
		},
	].filter((action) => typeof action.onClick === "function");

	return (
		<Card className="flex h-[340px] w-full flex-col gap-0">
			<CardContent className="flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex shrink-0 items-start justify-between gap-3">
					<div className="flex min-w-0 flex-col gap-1">
						<h3 className="text-lg font-semibold text-foreground wrap-break-word">
							{displayTitle}
						</h3>
						{createdAtLabel && (
							<span className="text-xs text-muted-foreground">
								{createdAtLabel}
							</span>
						)}
					</div>
					{isTask && (
						<Badge variant="outline" className="shrink-0 text-xs">
							{completedCount}/{totalCount} concluídas
						</Badge>
					)}
				</div>

				{isTask ? (
					<div className="min-h-0 flex-1 space-y-2 overflow-hidden">
						{sortedTasks.slice(0, 5).map((task) => (
							<div key={task.id} className="flex items-start gap-2 text-sm">
								<div
									className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
										task.completed
											? "bg-success border-success"
											: "border-input"
									}`}
								>
									{task.completed && (
										<RiCheckLine className="h-3 w-3 text-background" />
									)}
								</div>
								<span
									className={`leading-relaxed ${
										task.completed
											? "text-muted-foreground line-through"
											: "text-foreground"
									}`}
								>
									{task.text}
								</span>
							</div>
						))}
						{tasks.length > 5 && (
							<p className="text-xs text-muted-foreground pl-5 py-1">
								+{tasks.length - 5}{" "}
								{tasks.length - 5 === 1 ? "tarefa" : "tarefas"}...
							</p>
						)}
					</div>
				) : (
					<p className="min-h-0 flex-1 overflow-hidden whitespace-pre-line text-sm text-muted-foreground wrap-break-word leading-relaxed">
						{note.description}
					</p>
				)}
			</CardContent>

			{actions.length > 0 ? (
				<CardFooter className="flex shrink-0 flex-wrap gap-3 px-6 pt-3 text-sm">
					{actions.map(({ label, icon, onClick, destructive }) => (
						<button
							key={label}
							type="button"
							onClick={() => onClick?.(note)}
							className={`flex items-center gap-1 font-medium transition-opacity hover:opacity-80 ${destructive ? "text-destructive" : "text-primary"}`}
							aria-label={`${label} anotação`}
						>
							{icon}
							{label}
						</button>
					))}
				</CardFooter>
			) : null}
		</Card>
	);
}
