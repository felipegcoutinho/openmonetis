"use server";

import { auth } from "@/lib/auth/config";
import { db, schema } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

const updatePreferencesSchema = z.object({
  disableMagnetlines: z.boolean(),
});

// Actions

export async function updateNameAction(
  data: z.infer<typeof updateNameSchema>
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

    await db
      .update(schema.user)
      .set({ name: fullName })
      .where(eq(schema.user.id, session.user.id));

    // Revalidar o layout do dashboard para atualizar a sidebar
    revalidatePath("/", "layout");

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
  data: z.infer<typeof updatePasswordSchema>
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
        eq(schema.account.providerId, "google")
      ),
    });

    if (userAccount) {
      return {
        success: false,
        error: "Não é possível alterar senha para contas autenticadas via Google",
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
    } catch (authError: any) {
      console.error("Erro na API do Better Auth:", authError);

      // Verificar se o erro é de senha incorreta
      if (authError?.message?.includes("password") || authError?.message?.includes("incorrect")) {
        return {
          success: false,
          error: "Senha atual incorreta",
        };
      }

      return {
        success: false,
        error: "Erro ao atualizar senha. Verifique se a senha atual está correta.",
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
  data: z.infer<typeof updateEmailSchema>
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
        eq(schema.account.providerId, "google")
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

      // Validar senha tentando fazer changePassword para a mesma senha
      // Se falhar, a senha atual está incorreta
      try {
        await auth.api.changePassword({
          body: {
            newPassword: validated.password,
            currentPassword: validated.password,
          },
          headers: await headers(),
        });
      } catch (authError: any) {
        // Se der erro é porque a senha está incorreta
        console.error("Erro ao validar senha:", authError);
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
        ne(schema.user.id, session.user.id)
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
  data: z.infer<typeof deleteAccountSchema>
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
  data: z.infer<typeof updatePreferencesSchema>
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
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, session.user.id))
      .limit(1);

    const existing = existingResult[0] || null;

    if (existing) {
      // Update existing preferences
      await db
        .update(schema.userPreferences)
        .set({
          disableMagnetlines: validated.disableMagnetlines,
          updatedAt: new Date(),
        })
        .where(eq(schema.userPreferences.userId, session.user.id));
    } else {
      // Create new preferences
      await db.insert(schema.userPreferences).values({
        userId: session.user.id,
        disableMagnetlines: validated.disableMagnetlines,
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
