"use client";

import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import {
	type ReactNode,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	createNoteAction,
	updateNoteAction,
} from "@/app/(dashboard)/anotacoes/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useControlledState } from "@/hooks/use-controlled-state";
import { useFormState } from "@/hooks/use-form-state";
import { Card } from "../ui/card";
import type { Note, NoteFormValues, Task } from "./types";

type NoteDialogMode = "create" | "update";
interface NoteDialogProps {
	mode: NoteDialogMode;
	trigger?: ReactNode;
	note?: Note;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
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
}: NoteDialogProps) {
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [newTaskText, setNewTaskText] = useState("");

	const titleRef = useRef<HTMLInputElement>(null);
	const descRef = useRef<HTMLTextAreaElement>(null);
	const newTaskRef = useRef<HTMLInputElement>(null);

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = buildInitialValues(note);

	// Use form state hook for form management
	const { formState, updateField, setFormState } =
		useFormState<NoteFormValues>(initialState);

	useEffect(() => {
		if (dialogOpen) {
			setFormState(buildInitialValues(note));
			setErrorMessage(null);
			setNewTaskText("");
			requestAnimationFrame(() => titleRef.current?.focus());
		}
	}, [dialogOpen, note, setFormState]);

	const title = mode === "create" ? "Nova anotação" : "Editar anotação";
	const description =
		mode === "create"
			? "Escolha entre uma nota simples ou uma lista de tarefas."
			: "Altere o título e/ou conteúdo desta anotação.";
	const submitLabel =
		mode === "create" ? "Salvar anotação" : "Atualizar anotação";

	const titleCount = formState.title.length;
	const descCount = formState.description.length;
	const isNote = formState.type === "nota";

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

	const disableSubmit = isPending || onlySpaces || unchanged || invalidLen;

	const handleOpenChange = (v: boolean) => {
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
	};

	const handleToggleTask = (taskId: string) => {
		updateField(
			"tasks",
			(formState.tasks || []).map((t) =>
				t.id === taskId ? { ...t, completed: !t.completed } : t,
			),
		);
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
			let result: { success: boolean; message?: string; error?: string };
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
				toast.success(result.message);
				setDialogOpen(false);
				return;
			}
			setErrorMessage(result.error);
			toast.error(result.error);
			titleRef.current?.focus();
		});
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={handleSubmit}
					onKeyDown={handleKeyDown}
					noValidate
				>
					{/* Seletor de Tipo - apenas no modo de criação */}
					{mode === "create" && (
						<div className="space-y-3">
							<label className="text-sm font-medium text-foreground">
								Tipo de anotação
							</label>
							<RadioGroup
								value={formState.type}
								onValueChange={(value) =>
									updateField("type", value as "nota" | "tarefa")
								}
								disabled={isPending}
								className="flex gap-4"
							>
								<div className="flex items-center gap-2">
									<RadioGroupItem value="nota" id="tipo-nota" />
									<label
										htmlFor="tipo-nota"
										className="text-sm cursor-pointer select-none"
									>
										Nota
									</label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem value="tarefa" id="tipo-tarefa" />
									<label
										htmlFor="tipo-tarefa"
										className="text-sm cursor-pointer select-none"
									>
										Tarefas
									</label>
								</div>
							</RadioGroup>
						</div>
					)}

					{/* Título */}
					<div className="space-y-2">
						<label
							htmlFor="note-title"
							className="text-sm font-medium text-foreground"
						>
							Título
						</label>
						<Input
							id="note-title"
							ref={titleRef}
							value={formState.title}
							onChange={(e) => updateField("title", e.target.value)}
							placeholder={
								isNote ? "Ex.: Revisar metas do mês" : "Ex.: Tarefas da semana"
							}
							maxLength={MAX_TITLE}
							disabled={isPending}
							aria-describedby="note-title-help"
							required
						/>
						<p
							id="note-title-help"
							className="text-xs text-muted-foreground"
							aria-live="polite"
						>
							Até {MAX_TITLE} caracteres. Restantes:{" "}
							{Math.max(0, MAX_TITLE - titleCount)}.
						</p>
					</div>

					{/* Conteúdo - apenas para Notas */}
					{isNote && (
						<div className="space-y-2">
							<label
								htmlFor="note-description"
								className="text-sm font-medium text-foreground"
							>
								Conteúdo
							</label>
							<Textarea
								id="note-description"
								className="field-sizing-fixed"
								ref={descRef}
								value={formState.description}
								onChange={(e) => updateField("description", e.target.value)}
								placeholder="Detalhe sua anotação..."
								rows={6}
								maxLength={MAX_DESC}
								disabled={isPending}
								aria-describedby="note-desc-help"
								required
							/>
							<p
								id="note-desc-help"
								className="text-xs text-muted-foreground"
								aria-live="polite"
							>
								Até {MAX_DESC} caracteres. Restantes:{" "}
								{Math.max(0, MAX_DESC - descCount)}.
							</p>
						</div>
					)}

					{/* Lista de Tarefas - apenas para Tarefas */}
					{!isNote && (
						<div className="space-y-4">
							<div className="space-y-2">
								<label
									htmlFor="new-task-input"
									className="text-sm font-medium text-foreground"
								>
									Adicionar tarefa
								</label>
								<div className="flex gap-2">
									<Input
										id="new-task-input"
										ref={newTaskRef}
										value={newTaskText}
										onChange={(e) => setNewTaskText(e.target.value)}
										placeholder="Ex.: Comprar ingredientes para o jantar"
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
										onClick={handleAddTask}
										disabled={isPending || !normalize(newTaskText)}
										className="shrink-0"
									>
										<RiAddLine className="h-4 w-4" />
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Pressione Enter ou clique no botão + para adicionar
								</p>
							</div>

							{/* Lista de tarefas existentes */}
							{formState.tasks && formState.tasks.length > 0 && (
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground">
										Tarefas ({formState.tasks.length})
									</label>
									<div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
										{formState.tasks.map((task) => (
											<Card
												key={task.id}
												className="flex items-center gap-3 px-3 py-2 flex-row mt-1"
											>
												<Checkbox
													className="data-[state=checked]:bg-success data-[state=checked]:border-success"
													checked={task.completed}
													onCheckedChange={() => handleToggleTask(task.id)}
													disabled={isPending}
													aria-label={`Marcar tarefa "${task.text}" como ${
														task.completed ? "não concluída" : "concluída"
													}`}
												/>
												<span
													className={`flex-1 text-sm wrap-break-word ${
														task.completed
															? "text-muted-foreground"
															: "text-foreground"
													}`}
												>
													{task.text}
												</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveTask(task.id)}
													disabled={isPending}
													className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
													aria-label={`Remover tarefa "${task.text}"`}
												>
													<RiDeleteBinLine className="h-4 w-4" />
												</Button>
											</Card>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{errorMessage ? (
						<p className="text-sm text-destructive" role="alert">
							{errorMessage}
						</p>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={disableSubmit}>
							{isPending ? "Salvando..." : submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
