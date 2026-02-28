"use client";

import { RiAddCircleLine, RiTodoLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	arquivarAnotacaoAction,
	deleteNoteAction,
} from "@/app/(dashboard)/anotacoes/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "../ui/card";
import { NoteCard } from "./note-card";
import { NoteDetailsDialog } from "./note-details-dialog";
import { NoteDialog } from "./note-dialog";
import type { Note } from "./types";

interface NotesPageProps {
	notes: Note[];
	archivedNotes: Note[];
}

export function NotesPage({ notes, archivedNotes }: NotesPageProps) {
	const [activeTab, setActiveTab] = useState("ativas");
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [noteDetails, setNoteDetails] = useState<Note | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [noteToRemove, setNoteToRemove] = useState<Note | null>(null);
	const [arquivarOpen, setArquivarOpen] = useState(false);
	const [noteToArquivar, setNoteToArquivar] = useState<Note | null>(null);

	const sortNotes = useCallback(
		(list: Note[]) =>
			[...list].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		[],
	);

	const sortedNotes = useMemo(() => sortNotes(notes), [notes, sortNotes]);
	const sortedArchivedNotes = useMemo(
		() => sortNotes(archivedNotes),
		[archivedNotes, sortNotes],
	);

	const isArquivadas = activeTab === "arquivadas";

	const handleCreateOpenChange = useCallback((open: boolean) => {
		setCreateOpen(open);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setNoteToEdit(null);
		}
	}, []);

	const handleDetailsOpenChange = useCallback((open: boolean) => {
		setDetailsOpen(open);
		if (!open) {
			setNoteDetails(null);
		}
	}, []);

	const handleRemoveOpenChange = useCallback((open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setNoteToRemove(null);
		}
	}, []);

	const handleArquivarOpenChange = useCallback((open: boolean) => {
		setArquivarOpen(open);
		if (!open) {
			setNoteToArquivar(null);
		}
	}, []);

	const handleEditRequest = useCallback((note: Note) => {
		setNoteToEdit(note);
		setEditOpen(true);
	}, []);

	const handleDetailsRequest = useCallback((note: Note) => {
		setNoteDetails(note);
		setDetailsOpen(true);
	}, []);

	const handleRemoveRequest = useCallback((note: Note) => {
		setNoteToRemove(note);
		setRemoveOpen(true);
	}, []);

	const handleArquivarRequest = useCallback((note: Note) => {
		setNoteToArquivar(note);
		setArquivarOpen(true);
	}, []);

	const handleArquivarConfirm = useCallback(async () => {
		if (!noteToArquivar) {
			return;
		}

		const result = await arquivarAnotacaoAction({
			id: noteToArquivar.id,
			arquivada: !isArquivadas,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [noteToArquivar, isArquivadas]);

	const handleRemoveConfirm = useCallback(async () => {
		if (!noteToRemove) {
			return;
		}

		const result = await deleteNoteAction({ id: noteToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [noteToRemove]);

	const removeTitle = noteToRemove
		? noteToRemove.title.trim().length
			? `Remover anotação "${noteToRemove.title}"?`
			: "Remover anotação?"
		: "Remover anotação?";

	const arquivarTitle = noteToArquivar
		? noteToArquivar.title.trim().length
			? isArquivadas
				? `Desarquivar anotação "${noteToArquivar.title}"?`
				: `Arquivar anotação "${noteToArquivar.title}"?`
			: isArquivadas
				? "Desarquivar anotação?"
				: "Arquivar anotação?"
		: isArquivadas
			? "Desarquivar anotação?"
			: "Arquivar anotação?";

	const renderNoteList = (list: Note[], isArchived: boolean) => {
		if (list.length === 0) {
			return (
				<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
					<EmptyState
						media={<RiTodoLine className="size-6 text-primary" />}
						title={
							isArchived
								? "Nenhuma anotação arquivada"
								: "Nenhuma anotação registrada"
						}
						description={
							isArchived
								? "As anotações arquivadas aparecerão aqui."
								: "Crie anotações personalizadas para acompanhar lembretes, decisões ou observações financeiras importantes."
						}
					/>
				</Card>
			);
		}

		return (
			<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
				{list.map((note) => (
					<NoteCard
						key={note.id}
						note={note}
						onEdit={handleEditRequest}
						onDetails={handleDetailsRequest}
						onRemove={handleRemoveRequest}
						onArquivar={handleArquivarRequest}
						isArquivadas={isArchived}
					/>
				))}
			</div>
		);
	};

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex">
					<NoteDialog
						mode="create"
						open={createOpen}
						onOpenChange={handleCreateOpenChange}
						trigger={
							<Button className="w-full sm:w-auto">
								<RiAddCircleLine className="size-4" />
								Nova anotação
							</Button>
						}
					/>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList>
						<TabsTrigger value="ativas">Ativas</TabsTrigger>
						<TabsTrigger value="arquivadas">Arquivadas</TabsTrigger>
					</TabsList>

					<TabsContent value="ativas" className="mt-4">
						{renderNoteList(sortedNotes, false)}
					</TabsContent>

					<TabsContent value="arquivadas" className="mt-4">
						{renderNoteList(sortedArchivedNotes, true)}
					</TabsContent>
				</Tabs>
			</div>

			<NoteDialog
				mode="update"
				note={noteToEdit ?? undefined}
				open={editOpen}
				onOpenChange={handleEditOpenChange}
			/>

			<NoteDetailsDialog
				note={noteDetails}
				open={detailsOpen}
				onOpenChange={handleDetailsOpenChange}
			/>

			<ConfirmActionDialog
				open={arquivarOpen}
				onOpenChange={handleArquivarOpenChange}
				title={arquivarTitle}
				description={
					isArquivadas
						? "A anotação será movida de volta para a lista principal."
						: "A anotação será movida para arquivadas."
				}
				confirmLabel={isArquivadas ? "Desarquivar" : "Arquivar"}
				confirmVariant="default"
				pendingLabel={isArquivadas ? "Desarquivando..." : "Arquivando..."}
				onConfirm={handleArquivarConfirm}
			/>

			<ConfirmActionDialog
				open={removeOpen}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Essa ação não pode ser desfeita."
				confirmLabel="Remover"
				confirmVariant="destructive"
				pendingLabel="Removendo..."
				onConfirm={handleRemoveConfirm}
			/>
		</>
	);
}
