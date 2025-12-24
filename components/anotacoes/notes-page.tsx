"use client";

import { arquivarAnotacaoAction, deleteNoteAction } from "@/app/(dashboard)/anotacoes/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { RiAddCircleLine, RiTodoLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { NoteCard } from "./note-card";
import { NoteDetailsDialog } from "./note-details-dialog";
import { NoteDialog } from "./note-dialog";
import type { Note } from "./types";

interface NotesPageProps {
  notes: Note[];
  isArquivadas?: boolean;
}

export function NotesPage({ notes, isArquivadas = false }: NotesPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDetails, setNoteDetails] = useState<Note | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [noteToRemove, setNoteToRemove] = useState<Note | null>(null);
  const [arquivarOpen, setArquivarOpen] = useState(false);
  const [noteToArquivar, setNoteToArquivar] = useState<Note | null>(null);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notes]
  );

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

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        {!isArquivadas && (
          <div className="flex justify-start">
            <NoteDialog
              mode="create"
              open={createOpen}
              onOpenChange={handleCreateOpenChange}
              trigger={
                <Button>
                  <RiAddCircleLine className="size-4" />
                  Nova anotação
                </Button>
              }
            />
          </div>
        )}

        {sortedNotes.length === 0 ? (
          <Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <EmptyState
              media={<RiTodoLine className="size-6 text-primary" />}
              title={
                isArquivadas
                  ? "Nenhuma anotação arquivada"
                  : "Nenhuma anotação registrada"
              }
              description={
                isArquivadas
                  ? "As anotações arquivadas aparecerão aqui."
                  : "Crie anotações personalizadas para acompanhar lembretes, decisões ou observações financeiras importantes."
              }
            />
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditRequest}
                onDetails={handleDetailsRequest}
                onRemove={handleRemoveRequest}
                onArquivar={handleArquivarRequest}
                isArquivadas={isArquivadas}
              />
            ))}
          </div>
        )}
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
