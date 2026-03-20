"use client";
import { RiCheckLine, RiCloseLine, RiLoader4Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { authClient, googleSignInAvailable } from "@/shared/lib/auth/client";
import { cn } from "@/shared/utils/ui";
import { AuthCardShell } from "./auth-card-shell";
import { AuthErrorAlert } from "./auth-error-alert";
import { AuthHeader } from "./auth-header";
import { GoogleAuthButton } from "./google-auth-button";

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

type DivProps = React.ComponentProps<"div">;

const authLinkClassName =
	"font-medium text-foreground/88 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/30 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function SignupForm({ className, ...props }: DivProps) {
	const router = useRouter();
	const isGoogleAvailable = googleSignInAvailable;

	const [fullname, setFullname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState("");
	const [loadingEmail, setLoadingEmail] = useState(false);
	const [loadingGoogle, setLoadingGoogle] = useState(false);

	const passwordValidation = validatePassword(password);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!passwordValidation.isValid) {
			setError("A senha não atende aos requisitos de segurança.");
			return;
		}

		await authClient.signUp.email(
			{
				email,
				password,
				name: fullname,
			},
			{
				onRequest: () => {
					setError("");
					setLoadingEmail(true);
				},
				onSuccess: () => {
					setLoadingEmail(false);
					toast.success("Conta criada com sucesso!");
					router.replace("/dashboard");
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setLoadingEmail(false);
				},
			},
		);
	}

	async function handleGoogle() {
		if (!isGoogleAvailable) {
			setError("Login com Google não está disponível no momento.");
			return;
		}

		// Ativa loading antes de iniciar o fluxo OAuth
		setError("");
		setLoadingGoogle(true);

		// OAuth redirect - o loading permanece até a página ser redirecionada
		await authClient.signIn.social(
			{
				provider: "google",
				callbackURL: "/dashboard",
			},
			{
				onError: (ctx) => {
					// Só desativa loading se houver erro
					setError(ctx.error.message);
					setLoadingGoogle(false);
				},
			},
		);
	}

	return (
		<div className={cn("flex flex-col gap-5", className)} {...props}>
			<AuthCardShell>
				<form
					className="flex w-full items-center px-6 py-7 md:px-10 md:py-9"
					onSubmit={handleSubmit}
					noValidate
				>
					<FieldGroup className="mx-auto w-full max-w-md gap-5">
						<AuthHeader
							title="Criar sua conta"
							description="Comece com uma base organizada para acompanhar despesas, cartões e objetivos mensais."
						/>

						<AuthErrorAlert error={error} />

						<Field>
							<FieldLabel htmlFor="name">Nome completo</FieldLabel>
							<Input
								id="name"
								type="text"
								placeholder="Digite seu nome"
								autoComplete="name"
								required
								value={fullname}
								onChange={(e) => setFullname(e.target.value)}
								aria-invalid={!!error}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="email">E-mail</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="Digite seu e-mail"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								aria-invalid={!!error}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="password">Senha</FieldLabel>
							<Input
								id="password"
								type="password"
								required
								autoComplete="new-password"
								placeholder="Crie uma senha forte"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								aria-invalid={
									!!error ||
									(password.length > 0 && !passwordValidation.isValid)
								}
								maxLength={23}
							/>
							{password.length > 0 && (
								<div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-muted/35 p-3">
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
						</Field>

						<Field>
							<Button
								type="submit"
								disabled={
									loadingEmail ||
									loadingGoogle ||
									(password.length > 0 && !passwordValidation.isValid)
								}
								className="w-full"
							>
								{loadingEmail ? (
									<RiLoader4Line className="h-4 w-4 animate-spin" />
								) : (
									"Criar conta"
								)}
							</Button>
						</Field>

						<FieldSeparator className="my-1.5 *:data-[slot=field-separator-content]:bg-card">
							Ou continue com
						</FieldSeparator>

						<Field>
							<GoogleAuthButton
								onClick={handleGoogle}
								loading={loadingGoogle}
								disabled={loadingEmail || loadingGoogle || !isGoogleAvailable}
								text="Continuar com Google"
							/>
						</Field>

						<FieldDescription className="pt-1 text-center">
							Já tem uma conta?{" "}
							<a href="/login" className={authLinkClassName}>
								Entrar
							</a>
						</FieldDescription>

						<FieldDescription className="text-center text-[13px] text-muted-foreground">
							<a href="/" className={authLinkClassName}>
								Voltar para a página inicial
							</a>
						</FieldDescription>
					</FieldGroup>
				</form>
			</AuthCardShell>
		</div>
	);
}
