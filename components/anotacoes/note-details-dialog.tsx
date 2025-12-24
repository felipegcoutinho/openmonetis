"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiCheckLine } from "@remixicon/react";
import { useMemo } from "react";
import { Card } from "../ui/card";
import type { Note } from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

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
  const { formattedDate, displayTitle } = useMemo(() => {
    if (!note) {
      return { formattedDate: "", displayTitle: "" };
    }

    const title = note.title.trim().length ? note.title : "Anotação sem título";

    return {
      formattedDate: DATE_FORMATTER.format(new Date(note.createdAt)),
      displayTitle: title,
    };
  }, [note]);

  if (!note) {
    return null;
  }

  const isTask = note.type === "tarefa";
  const tasks = note.tasks || [];
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
          <div className="max-h-[320px] overflow-auto space-y-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="flex gap-3 p-3 flex-row items-center"
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    task.completed
                      ? "bg-green-600 border-green-600"
                      : "border-input"
                  }`}
                >
                  {task.completed && (
                    <RiCheckLine className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    task.completed ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
              </Card>
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
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
