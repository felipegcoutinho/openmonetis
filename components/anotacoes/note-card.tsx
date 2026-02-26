"use client";

import {
	RiArchiveLine,
	RiCheckLine,
	RiDeleteBin5Line,
	RiEyeLine,
	RiInboxUnarchiveLine,
	RiPencilLine,
} from "@remixicon/react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Note } from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "medium",
});

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
	const { displayTitle } = useMemo(() => {
		const resolvedTitle = note.title.trim().length
			? note.title
			: "Anotação sem título";

		return {
			displayTitle: resolvedTitle,
			formattedDate: DATE_FORMATTER.format(new Date(note.createdAt)),
		};
	}, [note.createdAt, note.title]);

	const isTask = note.type === "tarefa";
	const tasks = note.tasks || [];
	const completedCount = tasks.filter((t) => t.completed).length;
	const totalCount = tasks.length;

	const actions = [
		{
			label: "editar",
			icon: <RiPencilLine className="size-4" aria-hidden />,
			onClick: onEdit,
			variant: "default" as const,
		},
		{
			label: "detalhes",
			icon: <RiEyeLine className="size-4" aria-hidden />,
			onClick: onDetails,
			variant: "default" as const,
		},
		{
			label: isArquivadas ? "desarquivar" : "arquivar",
			icon: isArquivadas ? (
				<RiInboxUnarchiveLine className="size-4" aria-hidden />
			) : (
				<RiArchiveLine className="size-4" aria-hidden />
			),
			onClick: onArquivar,
			variant: "default" as const,
		},
		{
			label: "remover",
			icon: <RiDeleteBin5Line className="size-4" aria-hidden />,
			onClick: onRemove,
			variant: "destructive" as const,
		},
	].filter((action) => typeof action.onClick === "function");

	return (
		<Card className="flex h-[300px] w-[440px] flex-col gap-0">
			<CardContent className="flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex shrink-0 items-start justify-between gap-3">
					<div className="flex flex-col gap-2">
						<h3 className="text-lg font-semibold leading-tight text-foreground wrap-break-word">
							{displayTitle}
						</h3>
					</div>
					{isTask && (
						<Badge variant="outline" className="text-xs">
							{completedCount}/{totalCount} concluídas
						</Badge>
					)}
				</div>

				{isTask ? (
					<div className="min-h-0 flex-1 space-y-2 overflow-hidden">
						{tasks.slice(0, 5).map((task) => (
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
										task.completed ? "text-muted-foreground" : "text-foreground"
									}`}
								>
									{task.text}
								</span>
							</div>
						))}
						{tasks.length > 5 && (
							<p className="text-xs text-muted-foreground pl-5 py-1">
								+{tasks.length - 5}
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
					{actions.map(({ label, icon, onClick, variant }) => (
						<button
							key={label}
							type="button"
							onClick={() => onClick?.(note)}
							className={`flex items-center gap-1 font-medium transition-opacity hover:opacity-80 ${
								variant === "destructive" ? "text-destructive" : "text-primary"
							}`}
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
