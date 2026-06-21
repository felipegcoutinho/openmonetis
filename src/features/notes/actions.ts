"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { attachments, noteAttachments, notes } from "@/db/schema";
import {
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { uuidSchema } from "@/shared/lib/schemas/common";
import { deleteS3Object } from "@/shared/lib/storage/presign";
import type { ActionResult } from "@/shared/lib/types/actions";

const taskSchema = z.object({
	id: z.string(),
	text: z.string().min(1, "O texto da tarefa não pode estar vazio."),
	completed: z.boolean(),
});

const noteBaseSchema = z
	.object({
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
	})
	.refine(
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
			message:
				"Notas precisam de descrição e Tarefas precisam de ao menos uma tarefa.",
		},
	);

const createNoteSchema = noteBaseSchema;
const updateNoteSchema = noteBaseSchema.and(
	z.object({
		id: uuidSchema("Anotação"),
	}),
);
const deleteNoteSchema = z.object({
	id: uuidSchema("Anotação"),
});

type NoteCreateInput = z.input<typeof createNoteSchema>;
type NoteUpdateInput = z.input<typeof updateNoteSchema>;
type NoteDeleteInput = z.infer<typeof deleteNoteSchema>;

export async function createNoteAction(
	input: NoteCreateInput,
): Promise<ActionResult<{ noteId: string }>> {
	try {
		const user = await getUser();
		const data = createNoteSchema.parse(input);

		const [created] = await db
			.insert(notes)
			.values({
				title: data.title,
				description: data.description,
				type: data.type,
				tasks:
					data.tasks && data.tasks.length > 0
						? JSON.stringify(data.tasks)
						: null,
				userId: user.id,
			})
			.returning({ id: notes.id });

		if (!created) {
			return { success: false, error: "Não foi possível criar a anotação." };
		}

		revalidateForEntity("notes", user.id);

		return {
			success: true,
			message: "Anotação criada com sucesso.",
			data: { noteId: created.id },
		};
	} catch (error) {
		const result = handleActionError(error);
		return {
			success: false,
			error: result.success ? "Ocorreu um erro inesperado." : result.error,
		};
	}
}

export async function updateNoteAction(
	input: NoteUpdateInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = updateNoteSchema.parse(input);

		const [updated] = await db
			.update(notes)
			.set({
				title: data.title,
				description: data.description,
				type: data.type,
				tasks:
					data.tasks && data.tasks.length > 0
						? JSON.stringify(data.tasks)
						: null,
			})
			.where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
			.returning({ id: notes.id });

		if (!updated) {
			return {
				success: false,
				error: "Anotação não encontrada.",
			};
		}

		revalidateForEntity("notes", user.id);

		return { success: true, message: "Anotação atualizada com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteNoteAction(
	input: NoteDeleteInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteNoteSchema.parse(input);

		const linkedAttachments = await db
			.select({ id: attachments.id, fileKey: attachments.fileKey })
			.from(noteAttachments)
			.innerJoin(
				attachments,
				and(
					eq(noteAttachments.attachmentId, attachments.id),
					eq(attachments.userId, user.id),
				),
			)
			.innerJoin(
				notes,
				and(
					eq(noteAttachments.noteId, notes.id),
					eq(notes.id, data.id),
					eq(notes.userId, user.id),
				),
			);

		const [deleted] = await db
			.delete(notes)
			.where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
			.returning({ id: notes.id });

		if (!deleted) {
			return {
				success: false,
				error: "Anotação não encontrada.",
			};
		}

		if (linkedAttachments.length > 0) {
			await Promise.all(
				linkedAttachments.map((attachment) =>
					deleteS3Object(attachment.fileKey),
				),
			);
			await db.delete(attachments).where(
				and(
					eq(attachments.userId, user.id),
					inArray(
						attachments.id,
						linkedAttachments.map((attachment) => attachment.id),
					),
				),
			);
		}

		revalidateForEntity("notes", user.id);

		return { success: true, message: "Anotação removida com sucesso." };
	} catch (error) {
		return handleActionError(error);
	}
}

const arquivarNoteSchema = z.object({
	id: uuidSchema("Anotação"),
	archived: z.boolean(),
});

type NoteArquivarInput = z.infer<typeof arquivarNoteSchema>;

export async function archiveNoteAction(
	input: NoteArquivarInput,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = arquivarNoteSchema.parse(input);

		const [updated] = await db
			.update(notes)
			.set({
				archived: data.archived,
			})
			.where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
			.returning({ id: notes.id });

		if (!updated) {
			return {
				success: false,
				error: "Anotação não encontrada.",
			};
		}

		revalidateForEntity("notes", user.id);

		return {
			success: true,
			message: data.archived
				? "Anotação arquivada com sucesso."
				: "Anotação desarquivada com sucesso.",
		};
	} catch (error) {
		return handleActionError(error);
	}
}
