"use client";

import {
	RiAlertLine,
	RiCheckLine,
	RiCloseLine,
	RiEyeLine,
	RiEyeOffLine,
} from "@remixicon/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePasswordAction } from "@/features/settings/actions";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/ui";

interface PasswordValidation {
	hasLowercase: boolean;
	hasUppercase: boolean;
	hasNumber: boolean;
	hasSpecial: boolean;
	hasMinLength: boolean;
	hasMaxLength: boolean;
	isValid: boolean;
}

function validatePassword(password: string): PasswordValidation {
	const hasLowercase = /[a-z]/.test(password);
	const hasUppercase = /[A-Z]/.test(password);
	const hasNumber = /\d/.test(password);
	const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
	const hasMinLength = password.length >= 7;
	const hasMaxLength = password.length <= 23;

	return {
		hasLowercase,
		hasUppercase,
		hasNumber,
		hasSpecial,
		hasMinLength,
		hasMaxLength,
		isValid:
			hasLowercase &&
			hasUppercase &&
			hasNumber &&
			hasSpecial &&
			hasMinLength &&
			hasMaxLength,
	};
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 text-xs transition-colors",
				met ? "text-success" : "text-muted-foreground",
			)}
		>
			{met ? (
				<RiCheckLine className="h-3.5 w-3.5" />
			) : (
				<RiCloseLine className="h-3.5 w-3.5" />
			)}
			<span>{label}</span>
		</div>
	);
}

type UpdatePasswordFormProps = {
	authProvider?: string; // 'google' | 'credential' | undefined
};

export function UpdatePasswordForm({ authProvider }: UpdatePasswordFormProps) {
	const [isPending, startTransition] = useTransition();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Verificar se o usuário usa login via Google
	const isGoogleAuth = authProvider === "google";

	// Validação em tempo real: senhas coincidem
	const passwordsMatch = !confirmPassword
		? null
		: newPassword === confirmPassword;

	// Validação de requisitos da senha
	const passwordValidation = validatePassword(newPassword);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validação frontend antes de enviar
		if (!passwordValidation.isValid) {
			toast.error("A senha não atende aos requisitos de segurança");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("As senhas não coincidem");
			return;
		}

		startTransition(async () => {
			const result = await updatePasswordAction({
				currentPassword,
				newPassword,
				confirmPassword,
			});

			if (result.success) {
				toast.success(result.message);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				toast.error(result.error);
			}
		});
	};

	// Se o usuário usa Google OAuth, mostrar aviso
	if (isGoogleAuth) {
		return (
			<div className="rounded-lg border border-warning/30 bg-warning/10 p-4 dark:border-warning/20 dark:bg-warning/10">
				<div className="flex gap-3">
					<RiAlertLine className="h-5 w-5 text-warning shrink-0 mt-0.5" />
					<div>
						<h3 className="font-medium text-warning">
							Alteração de senha não disponível
						</h3>
						<p className="mt-1 text-sm text-warning">
							Você fez login usando sua conta do Google. A senha é gerenciada
							diretamente pelo Google e não pode ser alterada aqui. Para
							modificar sua senha, acesse as configurações de segurança da sua
							conta Google.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col space-y-6">
			<div className="space-y-4 max-w-md">
				{/* Senha atual */}
				<div className="space-y-2">
					<Label htmlFor="currentPassword">
						Senha atual <span className="text-destructive">*</span>
					</Label>
					<div className="relative">
						<Input
							id="currentPassword"
							type={showCurrentPassword ? "text" : "password"}
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							disabled={isPending}
							placeholder="Digite sua senha atual"
							required
							aria-required="true"
							aria-describedby="current-password-help"
						/>
						<button
							type="button"
							onClick={() => setShowCurrentPassword(!showCurrentPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={
								showCurrentPassword
									? "Ocultar senha atual"
									: "Mostrar senha atual"
							}
						>
							{showCurrentPassword ? (
								<RiEyeOffLine size={20} />
							) : (
								<RiEyeLine size={20} />
							)}
						</button>
					</div>
					<p
						id="current-password-help"
						className="text-xs text-muted-foreground"
					>
						Por segurança, confirme sua senha atual antes de alterá-la
					</p>
				</div>

				{/* Nova senha */}
				<div className="space-y-2">
					<Label htmlFor="newPassword">
						Nova senha <span className="text-destructive">*</span>
					</Label>
					<div className="relative">
						<Input
							id="newPassword"
							type={showNewPassword ? "text" : "password"}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							disabled={isPending}
							placeholder="Crie uma senha forte"
							required
							minLength={7}
							maxLength={23}
							aria-required="true"
							aria-describedby="new-password-help"
							aria-invalid={
								newPassword.length > 0 && !passwordValidation.isValid
							}
						/>
						<button
							type="button"
							onClick={() => setShowNewPassword(!showNewPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={
								showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"
							}
						>
							{showNewPassword ? (
								<RiEyeOffLine size={20} />
							) : (
								<RiEyeLine size={20} />
							)}
						</button>
					</div>
					{/* Indicadores de requisitos da senha */}
					{newPassword.length > 0 && (
						<div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
							<PasswordRequirement
								met={passwordValidation.hasMinLength}
								label="Mínimo 7 caracteres"
							/>
							<PasswordRequirement
								met={passwordValidation.hasMaxLength}
								label="Máximo 23 caracteres"
							/>
							<PasswordRequirement
								met={passwordValidation.hasLowercase}
								label="Letra minúscula"
							/>
							<PasswordRequirement
								met={passwordValidation.hasUppercase}
								label="Letra maiúscula"
							/>
							<PasswordRequirement
								met={passwordValidation.hasNumber}
								label="Número"
							/>
							<PasswordRequirement
								met={passwordValidation.hasSpecial}
								label="Caractere especial"
							/>
						</div>
					)}
				</div>

				{/* Confirmar nova senha */}
				<div className="space-y-2">
					<Label htmlFor="confirmPassword">
						Confirmar nova senha <span className="text-destructive">*</span>
					</Label>
					<div className="relative">
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={isPending}
							placeholder="Repita a senha"
							required
							minLength={6}
							aria-required="true"
							aria-describedby="confirm-password-help"
							aria-invalid={passwordsMatch === false}
							className={
								passwordsMatch === false
									? "border-destructive focus-visible:ring-destructive"
									: passwordsMatch === true
										? "border-success focus-visible:ring-success"
										: ""
							}
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={
								showConfirmPassword
									? "Ocultar confirmação de senha"
									: "Mostrar confirmação de senha"
							}
						>
							{showConfirmPassword ? (
								<RiEyeOffLine size={20} />
							) : (
								<RiEyeLine size={20} />
							)}
						</button>
						{/* Indicador visual de match */}
						{passwordsMatch !== null && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								{passwordsMatch ? (
									<RiCheckLine
										className="h-5 w-5 text-success"
										aria-label="As senhas coincidem"
									/>
								) : (
									<RiCloseLine
										className="h-5 w-5 text-destructive"
										aria-label="As senhas não coincidem"
									/>
								)}
							</div>
						)}
					</div>
					{/* Mensagem de erro em tempo real */}
					{passwordsMatch === false && (
						<p
							id="confirm-password-help"
							className="text-xs text-destructive flex items-center gap-1"
							role="alert"
						>
							<RiCloseLine className="h-3.5 w-3.5" />
							As senhas não coincidem
						</p>
					)}
					{passwordsMatch === true && (
						<p
							id="confirm-password-help"
							className="text-xs text-success flex items-center gap-1"
						>
							<RiCheckLine className="h-3.5 w-3.5" />
							As senhas coincidem
						</p>
					)}
				</div>
			</div>

			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={
						isPending ||
						passwordsMatch === false ||
						(newPassword.length > 0 && !passwordValidation.isValid)
					}
					className="w-fit"
				>
					{isPending ? "Atualizando..." : "Atualizar senha"}
				</Button>
			</div>
		</form>
	);
}
