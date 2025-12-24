"use server";

import { anotacoes } from "@/db/schema";
import { handleActionError, revalidateForEntity } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { uuidSchema } from "@/lib/schemas/common";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const taskSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "O texto da tarefa não pode estar vazio."),
  completed: z.boolean(),
});

const noteBaseSchema = z.object({
  title: z
    .string({ message: "Informe o título da anotação." })
    .trim()
    .min(1, "Informe o título da anotação.")
    .max(30, "O título deve ter no máximo 30 caracteres."),
  description: z
    .string({ message: "Informe o conteúdo da anotação." })
    .trim()
    .max(350, "O conteúdo deve ter no máximo 350 caracteres.")
    .optional()
    .default(""),
  type: z.enum(["nota", "tarefa"], {
    message: "O tipo deve ser 'nota' ou 'tarefa'.",
  }),
  tasks: z.array(taskSchema).optional().default([]),
}).refine(
  (data) => {
    // Se for nota, a descrição é obrigatória
    if (data.type === "nota") {
      return data.description.trim().length > 0;
    }
    // Se for tarefa, deve ter pelo menos uma tarefa
    if (data.type === "tarefa") {
      return data.tasks && data.tasks.length > 0;
    }
    return true;
  },
  {
    message: "Notas precisam de descrição e Tarefas precisam de ao menos uma tarefa.",
  }
);

const createNoteSchema = noteBaseSchema;
const updateNoteSchema = noteBaseSchema.and(z.object({
  id: uuidSchema("Anotação"),
}));
const deleteNoteSchema = z.object({
  id: uuidSchema("Anotação"),
});

type NoteCreateInput = z.infer<typeof createNoteSchema>;
type NoteUpdateInput = z.infer<typeof updateNoteSchema>;
type NoteDeleteInput = z.infer<typeof deleteNoteSchema>;

export async function createNoteAction(
  input: NoteCreateInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = createNoteSchema.parse(input);

    await db.insert(anotacoes).values({
      title: data.title,
      description: data.description,
      type: data.type,
      tasks: data.tasks && data.tasks.length > 0 ? JSON.stringify(data.tasks) : null,
      userId: user.id,
    });

    revalidateForEntity("anotacoes");

    return { success: true, message: "Anotação criada com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateNoteAction(
  input: NoteUpdateInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = updateNoteSchema.parse(input);

    const [updated] = await db
      .update(anotacoes)
      .set({
        title: data.title,
        description: data.description,
        type: data.type,
        tasks: data.tasks && data.tasks.length > 0 ? JSON.stringify(data.tasks) : null,
      })
      .where(and(eq(anotacoes.id, data.id), eq(anotacoes.userId, user.id)))
      .returning({ id: anotacoes.id });

    if (!updated) {
      return {
        success: false,
        error: "Anotação não encontrada.",
      };
    }

    revalidateForEntity("anotacoes");

    return { success: true, message: "Anotação atualizada com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteNoteAction(
  input: NoteDeleteInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = deleteNoteSchema.parse(input);

    const [deleted] = await db
      .delete(anotacoes)
      .where(and(eq(anotacoes.id, data.id), eq(anotacoes.userId, user.id)))
      .returning({ id: anotacoes.id });

    if (!deleted) {
      return {
        success: false,
        error: "Anotação não encontrada.",
      };
    }

    revalidateForEntity("anotacoes");

    return { success: true, message: "Anotação removida com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

const arquivarNoteSchema = z.object({
  id: uuidSchema("Anotação"),
  arquivada: z.boolean(),
});

type NoteArquivarInput = z.infer<typeof arquivarNoteSchema>;

export async function arquivarAnotacaoAction(
  input: NoteArquivarInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = arquivarNoteSchema.parse(input);

    const [updated] = await db
      .update(anotacoes)
      .set({
        arquivada: data.arquivada,
      })
      .where(and(eq(anotacoes.id, data.id), eq(anotacoes.userId, user.id)))
      .returning({ id: anotacoes.id });

    if (!updated) {
      return {
        success: false,
        error: "Anotação não encontrada.",
      };
    }

    revalidateForEntity("anotacoes");

    return {
      success: true,
      message: data.arquivada
        ? "Anotação arquivada com sucesso."
        : "Anotação desarquivada com sucesso."
    };
  } catch (error) {
    return handleActionError(error);
  }
}
