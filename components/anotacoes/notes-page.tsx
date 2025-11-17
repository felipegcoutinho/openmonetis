"use client";

import { deleteNoteAction } from "@/app/(dashboard)/anotacoes/actions";
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
}

export function NotesPage({ notes }: NotesPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDetails, setNoteDetails] = useState<Note | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [noteToRemove, setNoteToRemove] = useState<Note | null>(null);

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

  return (
    <>
      <div className="flex w-full flex-col gap-6">
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

        {sortedNotes.length === 0 ? (
          <Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <EmptyState
              media={<RiTodoLine className="size-6 text-primary" />}
              title="Nenhuma anotação registrada"
              description="Crie anotações personalizadas para acompanhar lembretes, decisões ou observações financeiras importantes."
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
