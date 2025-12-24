import { anotacoes, type Anotacao } from "@/db/schema";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export type NoteData = {
  id: string;
  title: string;
  description: string;
  type: "nota" | "tarefa";
  tasks?: Task[];
  arquivada: boolean;
  createdAt: string;
};

export async function fetchNotesForUser(userId: string): Promise<NoteData[]> {
  const noteRows = await db.query.anotacoes.findMany({
    where: and(eq(anotacoes.userId, userId), eq(anotacoes.arquivada, false)),
    orderBy: (note: typeof anotacoes.$inferSelect, { desc }: { desc: (field: unknown) => unknown }) => [desc(note.createdAt)],
  });

  return noteRows.map((note: Anotacao) => {
    let tasks: Task[] | undefined;

    // Parse tasks if they exist
    if (note.tasks) {
      try {
        tasks = JSON.parse(note.tasks);
      } catch (error) {
        console.error("Failed to parse tasks for note", note.id, error);
        tasks = undefined;
      }
    }

    return {
      id: note.id,
      title: (note.title ?? "").trim(),
      description: (note.description ?? "").trim(),
      type: (note.type ?? "nota") as "nota" | "tarefa",
      tasks,
      arquivada: note.arquivada,
      createdAt: note.createdAt.toISOString(),
    };
  });
}

export async function fetchArquivadasForUser(userId: string): Promise<NoteData[]> {
  const noteRows = await db.query.anotacoes.findMany({
    where: and(eq(anotacoes.userId, userId), eq(anotacoes.arquivada, true)),
    orderBy: (note: typeof anotacoes.$inferSelect, { desc }: { desc: (field: unknown) => unknown }) => [desc(note.createdAt)],
  });

  return noteRows.map((note: Anotacao) => {
    let tasks: Task[] | undefined;

    // Parse tasks if they exist
    if (note.tasks) {
      try {
        tasks = JSON.parse(note.tasks);
      } catch (error) {
        console.error("Failed to parse tasks for note", note.id, error);
        tasks = undefined;
      }
    }

    return {
      id: note.id,
      title: (note.title ?? "").trim(),
      description: (note.description ?? "").trim(),
      type: (note.type ?? "nota") as "nota" | "tarefa",
      tasks,
      arquivada: note.arquivada,
      createdAt: note.createdAt.toISOString(),
    };
  });
}
