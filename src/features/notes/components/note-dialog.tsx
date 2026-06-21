"use client";

import {
	RiAddCircleFill,
	RiCheckLine,
	RiDeleteBinLine,
} from "@remixicon/react";
import {
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { createNoteAction, updateNoteAction } from "@/features/notes/actions";
import {
	NoteAttachmentsField,
	uploadNoteAttachment,
} from "@/features/notes/components/note-attachments-field";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { useFormState } from "@/shared/hooks/use-form-state";
import { cn } from "@/shared/utils/ui";
import {
	type Note,
	type NoteAttachment,
	type NoteFormValues,
	sortTasksByStatus,
	type Task,
} from "./types";

type NoteDialogMode = "create" | "update";
interface NoteDialogProps {
	mode: NoteDialogMode;
	trigger?: ReactNode;
	note?: Note;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	attachmentMaxSizeMb?: number;
}

const MAX_TITLE = 30;
const MAX_DESC = 350;
const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

const buildInitialValues = (note?: Note): NoteFormValues => ({
	title: note?.title ?? "",
	description: note?.description ?? "",
	type: note?.type ?? "nota",
	tasks: note?.tasks ?? [],
});

const generateTaskId = () => {
	return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export function NoteDialog({
	mode,
	trigger,
	note,
	open,
	onOpenChange,
	attachmentMaxSizeMb,
}: NoteDialogProps) {
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [newTaskText, setNewTaskText] = useState("");
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingTaskText, setEditingTaskText] = useState("");
	const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const [isAttachmentPending, setIsAttachmentPending] = useState(false);

	const titleRef = useRef<HTMLInputElement>(null);
	const descRef = useRef<HTMLTextAreaElement>(null);
	const newTaskRef = useRef<HTMLInputElement>(null);
	const editingTaskRef = useRef<HTMLInputElement>(null);

	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = buildInitialValues(note);

	const { formState, resetForm, updateField } =
		useFormState<NoteFormValues>(initialState);

	useEffect(() => {
		if (dialogOpen) {
			resetForm(buildInitialValues(note));
			setErrorMessage(null);
			setNewTaskText("");
			setEditingTaskId(null);
			setEditingTaskText("");
			setNoteAttachments(note?.attachments ?? []);
			setPendingFiles([]);
			setIsAttachmentPending(false);
			requestAnimationFrame(() => titleRef.current?.focus());
		}
	}, [dialogOpen, note, resetForm]);

	const dialogTitle =
		mode === "create" ? "Nova anotação" : "Atualizar anotação";
	const description =
		mode === "create"
			? "Crie uma nota simples ou uma lista de tarefas."
			: note?.type === "tarefa"
				? "Atualize sua lista de tarefas"
				: "Atualize sua nota";
	const submitLabel = mode === "create" ? "Salvar" : "Atualizar";

	const titleCount = formState.title.length;
	const descCount = formState.description.length;
	const isNote = formState.type === "nota";

	const sortedTasks = useMemo(
		() => sortTasksByStatus(formState.tasks || []),
		[formState.tasks],
	);

	const onlySpaces =
		normalize(formState.title).length === 0 ||
		(isNote && formState.description.trim().length === 0) ||
		(!isNote && (!formState.tasks || formState.tasks.length === 0));

	const invalidLen = titleCount > MAX_TITLE || descCount > MAX_DESC;

	const unchanged =
		mode === "update" &&
		normalize(formState.title) === normalize(note?.title ?? "") &&
		formState.description.trim() === (note?.description ?? "").trim() &&
		JSON.stringify(formState.tasks) === JSON.stringify(note?.tasks);

	const disableSubmit =
		isPending ||
		isAttachmentPending ||
		onlySpaces ||
		unchanged ||
		invalidLen ||
		Boolean(editingTaskId);

	const handleOpenChange = (v: boolean) => {
		if (!v && (isPending || isAttachmentPending)) return;
		setDialogOpen(v);
		if (!v) setErrorMessage(null);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
			(e.currentTarget as HTMLFormElement).requestSubmit();
		if (e.key === "Escape") handleOpenChange(false);
	};

	const handleAddTask = () => {
		const text = normalize(newTaskText);
		if (!text) return;

		const newTask: Task = {
			id: generateTaskId(),
			text,
			completed: false,
		};

		updateField("tasks", [...(formState.tasks || []), newTask]);
		setNewTaskText("");
		requestAnimationFrame(() => newTaskRef.current?.focus());
	};

	const handleRemoveTask = (taskId: string) => {
		updateField(
			"tasks",
			(formState.tasks || []).filter((t) => t.id !== taskId),
		);
		if (editingTaskId === taskId) {
			setEditingTaskId(null);
			setEditingTaskText("");
		}
	};

	const handleToggleTask = (taskId: string) => {
		updateField(
			"tasks",
			(formState.tasks || []).map((t) =>
				t.id === taskId ? { ...t, completed: !t.completed } : t,
			),
		);
	};

	const handleStartEditTask = (task: Task) => {
		if (isPending) return;

		setEditingTaskId(task.id);
		setEditingTaskText(task.text);
		requestAnimationFrame(() => {
			editingTaskRef.current?.focus();
			editingTaskRef.current?.select();
		});
	};

	const handleSaveTask = (taskId: string) => {
		const text = normalize(editingTaskText);
		if (!text) {
			toast.error("O texto da tarefa não pode estar vazio.");
			editingTaskRef.current?.focus();
			return;
		}

		updateField(
			"tasks",
			(formState.tasks || []).map((t) =>
				t.id === taskId ? { ...t, text } : t,
			),
		);
		setEditingTaskId(null);
		setEditingTaskText("");
	};

	const handleCancelEditTask = () => {
		setEditingTaskId(null);
		setEditingTaskText("");
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage(null);

		const payload = {
			title: normalize(formState.title),
			description: formState.description.trim(),
			type: formState.type,
			tasks: formState.tasks,
		};

		if (onlySpaces || invalidLen) {
			setErrorMessage("Preencha os campos respeitando os limites.");
			titleRef.current?.focus();
			return;
		}

		if (mode === "update" && !note?.id) {
			const msg = "Não foi possível identificar a anotação a ser editada.";
			setErrorMessage(msg);
			toast.error(msg);
			return;
		}

		if (unchanged) {
			toast.info("Nada para atualizar.");
			return;
		}

		startTransition(async () => {
			let result:
				| Awaited<ReturnType<typeof createNoteAction>>
				| Awaited<ReturnType<typeof updateNoteAction>>;
			if (mode === "create") {
				result = await createNoteAction(payload);
			} else {
				if (!note?.id) {
					const msg = "ID da anotação não encontrado.";
					setErrorMessage(msg);
					toast.error(msg);
					return;
				}
				result = await updateNoteAction({ id: note.id, ...payload });
			}

			if (result.success) {
				if (mode === "create" && pendingFiles.length > 0) {
					const noteId = "data" in result ? result.data?.noteId : undefined;
					if (noteId) {
						let failedUploads = 0;
						for (const file of pendingFiles) {
							const upload = await uploadNoteAttachment(noteId, file);
							if (!upload.success) failedUploads += 1;
						}
						if (failedUploads > 0) {
							toast.warning(
								failedUploads === 1
									? "A nota foi salva, mas um anexo não pôde ser enviado."
									: `A nota foi salva, mas ${failedUploads} anexos não puderam ser enviados.`,
							);
						} else {
							toast.success(
								pendingFiles.length === 1
									? "Anotação e anexo salvos."
									: "Anotação e anexos salvos.",
							);
						}
					}
				} else {
					toast.success(result.message);
				}
				setDialogOpen(false);
				return;
			}
			setErrorMessage(result.error ?? null);
			toast.error(result.error);
			titleRef.current?.focus();
		});
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form
					id="note-form"
					className="space-y-3 -mx-6 max-h-[80vh] overflow-y-auto px-6 pb-1"
					onSubmit={handleSubmit}
					onKeyDown={handleKeyDown}
					noValidate
				>
					{mode === "create" && (
						<div className="space-y-1">
							<Label>Tipo de anotação</Label>
							<div className="grid grid-cols-2 overflow-hidden rounded-md border">
								<button
									type="button"
									onClick={() => updateField("type", "nota")}
									disabled={isPending}
									className={cn(
										"py-1.5 text-sm transition-colors",
										formState.type === "nota"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
									)}
								>
									Nota
								</button>
								<button
									type="button"
									onClick={() => updateField("type", "tarefa")}
									disabled={isPending}
									className={cn(
										"border-l py-1.5 text-sm transition-colors",
										formState.type === "tarefa"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
									)}
								>
									Tarefas
								</button>
							</div>
						</div>
					)}

					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<Label htmlFor="note-title">Título</Label>
							<span
								className={cn(
									"text-xs",
									titleCount > MAX_TITLE
										? "text-destructive"
										: "text-muted-foreground",
								)}
							>
								{titleCount}/{MAX_TITLE}
							</span>
						</div>
						<Input
							id="note-title"
							ref={titleRef}
							value={formState.title}
							onChange={(e) => updateField("title", e.target.value)}
							placeholder={
								isNote ? "Ex.: Revisar metas do mês" : "Ex.: Tarefas da semana"
							}
							maxLength={MAX_TITLE + 10}
							disabled={isPending}
							required
						/>
					</div>

					{isNote && (
						<div className="space-y-3">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<Label htmlFor="note-description">Conteúdo</Label>
									<span
										className={cn(
											"text-xs",
											descCount > MAX_DESC
												? "text-destructive"
												: "text-muted-foreground",
										)}
									>
										{descCount}/{MAX_DESC}
									</span>
								</div>
								<Textarea
									id="note-description"
									className="field-sizing-fixed"
									ref={descRef}
									value={formState.description}
									onChange={(e) => updateField("description", e.target.value)}
									placeholder="Detalhe sua anotação..."
									rows={5}
									maxLength={MAX_DESC + 10}
									disabled={isPending}
									required
								/>
								<p className="text-xs text-muted-foreground">
									Ctrl+Enter para salvar
								</p>
							</div>

							<NoteAttachmentsField
								noteId={mode === "update" ? note?.id : undefined}
								attachments={noteAttachments}
								pendingFiles={pendingFiles}
								onAttachmentsChange={setNoteAttachments}
								onPendingFilesChange={setPendingFiles}
								onBusyChange={setIsAttachmentPending}
								maxSizeMb={attachmentMaxSizeMb}
								disabled={isPending}
							/>
						</div>
					)}

					{!isNote && (
						<div className="space-y-2">
							<div className="space-y-1">
								<Label htmlFor="new-task-input">Adicionar tarefa</Label>
								<div className="flex gap-2">
									<Input
										id="new-task-input"
										ref={newTaskRef}
										value={newTaskText}
										onChange={(e) => setNewTaskText(e.target.value)}
										placeholder="Nova tarefa..."
										disabled={isPending}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTask();
											}
										}}
									/>
									<Button
										type="button"
										variant="outline"
										onClick={handleAddTask}
										disabled={isPending || !normalize(newTaskText)}
										className="shrink-0 gap-1.5"
									>
										<RiAddCircleFill className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{sortedTasks.length > 0 && (
								<div className="mt-4 max-h-[300px] space-y-1 overflow-y-auto rounded-md bg-card p-2 pr-1">
									{sortedTasks.map((task) => (
										<div
											key={task.id}
											className="flex items-center gap-3 rounded-md px-3 py-1.5 hover:bg-muted/50"
										>
											{editingTaskId === task.id ? (
												<Input
													ref={editingTaskRef}
													value={editingTaskText}
													onChange={(e) => setEditingTaskText(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															e.stopPropagation();
															handleSaveTask(task.id);
														}
														if (e.key === "Escape") {
															e.preventDefault();
															e.stopPropagation();
															handleCancelEditTask();
														}
													}}
													disabled={isPending}
													className="h-8 min-w-0 flex-1"
													aria-label={`Editar "${task.text}"`}
												/>
											) : (
												<>
													<Checkbox
														className="data-[state=checked]:bg-success! data-[state=checked]:border-success! data-[state=checked]:text-success-foreground!"
														checked={task.completed}
														onCheckedChange={() => handleToggleTask(task.id)}
														disabled={isPending}
														aria-label={`Marcar "${task.text}" como ${
															task.completed ? "não concluída" : "concluída"
														}`}
													/>
													<button
														type="button"
														onClick={() => handleStartEditTask(task)}
														disabled={isPending}
														className={cn(
															"min-w-0 flex-1 cursor-text text-left text-sm wrap-break-word transition-colors hover:text-primary disabled:cursor-not-allowed",
															task.completed
																? "text-muted-foreground line-through"
																: "text-foreground",
														)}
													>
														{task.text}
													</button>
												</>
											)}
											<button
												type="button"
												onClick={() =>
													editingTaskId === task.id
														? handleSaveTask(task.id)
														: handleRemoveTask(task.id)
												}
												disabled={isPending}
												className={cn(
													"shrink-0 transition-colors",
													editingTaskId === task.id
														? "text-success hover:text-success/80"
														: "text-muted-foreground/50 hover:text-destructive",
												)}
												aria-label={
													editingTaskId === task.id
														? `Salvar "${task.text}"`
														: `Remover "${task.text}"`
												}
											>
												{editingTaskId === task.id ? (
													<RiCheckLine className="h-4 w-4" />
												) : (
													<RiDeleteBinLine className="h-3.5 w-3.5" />
												)}
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{errorMessage ? (
						<p className="text-sm text-destructive" role="alert">
							{errorMessage}
						</p>
					) : null}
				</form>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending || isAttachmentPending}
					>
						Cancelar
					</Button>
					<Button type="submit" form="note-form" disabled={disableSubmit}>
						{isPending ? "Salvando..." : submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
