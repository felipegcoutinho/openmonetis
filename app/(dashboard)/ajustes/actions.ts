"use server";

import { createHash, randomBytes } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { account, pagadores, tokensApi } from "@/db/schema";
import { auth } from "@/lib/auth/config";
import { db, schema } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";

type ActionResponse<T = void> = {
	success: boolean;
	message?: string;
	error?: string;
	data?: T;
};

// Schema de validação
const updateNameSchema = z.object({
	firstName: z.string().min(1, "Primeiro nome é obrigatório"),
	lastName: z.string().min(1, "Sobrenome é obrigatório"),
});

const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Senha atual é obrigatória"),
		newPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

const updateEmailSchema = z
	.object({
		password: z.string().optional(), // Opcional para usuários Google OAuth
		newEmail: z.string().email("E-mail inválido"),
		confirmEmail: z.string().email("E-mail inválido"),
	})
	.refine((data) => data.newEmail === data.confirmEmail, {
		message: "Os e-mails não coincidem",
		path: ["confirmEmail"],
	});

const deleteAccountSchema = z.object({
	confirmation: z.literal("DELETAR", {
		errorMap: () => ({ message: 'Você deve digitar "DELETAR" para confirmar' }),
	}),
});

const VALID_FONTS = [
	"ai-sans",
	"anthropic-sans",
	"fira-code",
	"fira-sans",
	"geist",
	"ibm-plex-mono",
	"inter",
	"jetbrains-mono",
	"reddit-sans",
	"roboto",
	"sf-pro-display",
	"sf-pro-rounded",
	"ubuntu",
] as const;

const updatePreferencesSchema = z.object({
	disableMagnetlines: z.boolean(),
	extratoNoteAsColumn: z.boolean(),
	lancamentosColumnOrder: z.array(z.string()).nullable(),
	systemFont: z.enum(VALID_FONTS).default("ai-sans"),
	moneyFont: z.enum(VALID_FONTS).default("ai-sans"),
});

// Actions

export async function updateNameAction(
	data: z.infer<typeof updateNameSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = updateNameSchema.parse(data);
		const fullName = `${validated.firstName} ${validated.lastName}`;

		// Atualizar nome do usuário
		await db
			.update(schema.user)
			.set({ name: fullName })
			.where(eq(schema.user.id, session.user.id));

		// Sincronizar nome com o pagador admin
		await db
			.update(pagadores)
			.set({ name: fullName })
			.where(
				and(
					eq(pagadores.userId, session.user.id),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				),
			);

		// Revalidar o layout do dashboard para atualizar a sidebar
		revalidatePath("/", "layout");
		revalidatePath("/pagadores");

		return {
			success: true,
			message: "Nome atualizado com sucesso",
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao atualizar nome:", error);
		return {
			success: false,
			error: "Erro ao atualizar nome. Tente novamente.",
		};
	}
}

export async function updatePasswordAction(
	data: z.infer<typeof updatePasswordSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id || !session?.user?.email) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = updatePasswordSchema.parse(data);

		// Verificar se o usuário tem conta com provedor Google
		const userAccount = await db.query.account.findFirst({
			where: and(
				eq(schema.account.userId, session.user.id),
				eq(schema.account.providerId, "google"),
			),
		});

		if (userAccount) {
			return {
				success: false,
				error:
					"Não é possível alterar senha para contas autenticadas via Google",
			};
		}

		// Usar a API do Better Auth para atualizar a senha
		try {
			await auth.api.changePassword({
				body: {
					newPassword: validated.newPassword,
					currentPassword: validated.currentPassword,
				},
				headers: await headers(),
			});

			return {
				success: true,
				message: "Senha atualizada com sucesso",
			};
		} catch (authError) {
			console.error("Erro na API do Better Auth:", authError);

			// Verificar se o erro é de senha incorreta
			if (
				authError?.message?.includes("password") ||
				authError?.message?.includes("incorrect")
			) {
				return {
					success: false,
					error: "Senha atual incorreta",
				};
			}

			return {
				success: false,
				error:
					"Erro ao atualizar senha. Verifique se a senha atual está correta.",
			};
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao atualizar senha:", error);
		return {
			success: false,
			error: "Erro ao atualizar senha. Tente novamente.",
		};
	}
}

export async function updateEmailAction(
	data: z.infer<typeof updateEmailSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id || !session?.user?.email) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = updateEmailSchema.parse(data);

		// Verificar se o usuário tem conta com provedor Google
		const userAccount = await db.query.account.findFirst({
			where: and(
				eq(schema.account.userId, session.user.id),
				eq(schema.account.providerId, "google"),
			),
		});

		const isGoogleAuth = !!userAccount;

		// Se não for Google OAuth, validar senha
		if (!isGoogleAuth) {
			if (!validated.password) {
				return {
					success: false,
					error: "Senha é obrigatória para confirmar a alteração",
				};
			}

			// Buscar hash da senha no registro de credencial
			const credentialAccount = await db
				.select({ password: account.password })
				.from(account)
				.where(
					and(
						eq(account.userId, session.user.id),
						eq(account.providerId, "credential"),
					),
				)
				.limit(1);

			const storedHash = credentialAccount[0]?.password;
			if (!storedHash) {
				return {
					success: false,
					error: "Conta de credencial não encontrada.",
				};
			}

			const isValid = await verifyPassword({
				password: validated.password,
				hash: storedHash,
			});

			if (!isValid) {
				return {
					success: false,
					error: "Senha incorreta",
				};
			}
		}

		// Verificar se o e-mail já está em uso por outro usuário
		const existingUser = await db.query.user.findFirst({
			where: and(
				eq(schema.user.email, validated.newEmail),
				ne(schema.user.id, session.user.id),
			),
		});

		if (existingUser) {
			return {
				success: false,
				error: "Este e-mail já está em uso",
			};
		}

		// Verificar se o novo e-mail é diferente do atual
		if (validated.newEmail.toLowerCase() === session.user.email.toLowerCase()) {
			return {
				success: false,
				error: "O novo e-mail deve ser diferente do atual",
			};
		}

		// Atualizar e-mail
		await db
			.update(schema.user)
			.set({
				email: validated.newEmail,
				emailVerified: false, // Marcar como não verificado
			})
			.where(eq(schema.user.id, session.user.id));

		// Revalidar o layout do dashboard para atualizar a sidebar
		revalidatePath("/", "layout");

		return {
			success: true,
			message:
				"E-mail atualizado com sucesso. Por favor, verifique seu novo e-mail.",
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao atualizar e-mail:", error);
		return {
			success: false,
			error: "Erro ao atualizar e-mail. Tente novamente.",
		};
	}
}

export async function deleteAccountAction(
	data: z.infer<typeof deleteAccountSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		// Validar confirmação
		deleteAccountSchema.parse(data);

		// Deletar todos os dados do usuário em cascade
		// O schema deve ter as relações configuradas com onDelete: cascade
		await db.delete(schema.user).where(eq(schema.user.id, session.user.id));

		return {
			success: true,
			message: "Conta deletada com sucesso",
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao deletar conta:", error);
		return {
			success: false,
			error: "Erro ao deletar conta. Tente novamente.",
		};
	}
}

export async function updatePreferencesAction(
	data: z.infer<typeof updatePreferencesSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = updatePreferencesSchema.parse(data);

		// Check if preferences exist, if not create them
		const existingResult = await db
			.select()
			.from(schema.preferenciasUsuario)
			.where(eq(schema.preferenciasUsuario.userId, session.user.id))
			.limit(1);

		const existing = existingResult[0] || null;

		if (existing) {
			// Update existing preferences
			await db
				.update(schema.preferenciasUsuario)
				.set({
					disableMagnetlines: validated.disableMagnetlines,
					extratoNoteAsColumn: validated.extratoNoteAsColumn,
					lancamentosColumnOrder: validated.lancamentosColumnOrder,
					systemFont: validated.systemFont,
					moneyFont: validated.moneyFont,
					updatedAt: new Date(),
				})
				.where(eq(schema.preferenciasUsuario.userId, session.user.id));
		} else {
			// Create new preferences
			await db.insert(schema.preferenciasUsuario).values({
				userId: session.user.id,
				disableMagnetlines: validated.disableMagnetlines,
				extratoNoteAsColumn: validated.extratoNoteAsColumn,
				lancamentosColumnOrder: validated.lancamentosColumnOrder,
				systemFont: validated.systemFont,
				moneyFont: validated.moneyFont,
			});
		}

		// Revalidar o layout do dashboard
		revalidatePath("/", "layout");

		return {
			success: true,
			message: "Preferências atualizadas com sucesso",
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao atualizar preferências:", error);
		return {
			success: false,
			error: "Erro ao atualizar preferências. Tente novamente.",
		};
	}
}

// API Token Actions

const createApiTokenSchema = z.object({
	name: z.string().min(1, "Nome do dispositivo é obrigatório").max(100),
});

const revokeApiTokenSchema = z.object({
	tokenId: z.string().uuid("ID do token inválido"),
});

function generateSecureToken(): string {
	const prefix = "os";
	const randomPart = randomBytes(32).toString("base64url");
	return `${prefix}_${randomPart}`;
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export async function createApiTokenAction(
	data: z.infer<typeof createApiTokenSchema>,
): Promise<ActionResponse<{ token: string; tokenId: string }>> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = createApiTokenSchema.parse(data);

		// Generate token
		const token = generateSecureToken();
		const tokenHash = hashToken(token);
		const tokenPrefix = token.substring(0, 10);

		// Save to database
		const [newToken] = await db
			.insert(tokensApi)
			.values({
				userId: session.user.id,
				name: validated.name,
				tokenHash,
				tokenPrefix,
				expiresAt: null, // No expiration for now
			})
			.returning({ id: tokensApi.id });

		revalidatePath("/ajustes");

		return {
			success: true,
			message: "Token criado com sucesso",
			data: {
				token,
				tokenId: newToken.id,
			},
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao criar token:", error);
		return {
			success: false,
			error: "Erro ao criar token. Tente novamente.",
		};
	}
}

export async function revokeApiTokenAction(
	data: z.infer<typeof revokeApiTokenSchema>,
): Promise<ActionResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return {
				success: false,
				error: "Não autenticado",
			};
		}

		const validated = revokeApiTokenSchema.parse(data);

		// Find token and verify ownership
		const [existingToken] = await db
			.select()
			.from(tokensApi)
			.where(
				and(
					eq(tokensApi.id, validated.tokenId),
					eq(tokensApi.userId, session.user.id),
					isNull(tokensApi.revokedAt),
				),
			)
			.limit(1);

		if (!existingToken) {
			return {
				success: false,
				error: "Token não encontrado",
			};
		}

		// Revoke token
		await db
			.update(tokensApi)
			.set({
				revokedAt: new Date(),
			})
			.where(eq(tokensApi.id, validated.tokenId));

		revalidatePath("/ajustes");

		return {
			success: true,
			message: "Token revogado com sucesso",
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || "Dados inválidos",
			};
		}

		console.error("Erro ao revogar token:", error);
		return {
			success: false,
			error: "Erro ao revogar token. Tente novamente.",
		};
	}
}
