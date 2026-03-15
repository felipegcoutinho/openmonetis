"use client";
import { RiFingerprintLine, RiLoader4Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
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

type DivProps = React.ComponentProps<"div">;

const authLinkClassName =
	"font-medium text-foreground/88 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/30 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function LoginForm({ className, ...props }: DivProps) {
	const router = useRouter();
	const isGoogleAvailable = googleSignInAvailable;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState("");
	const [loadingEmail, setLoadingEmail] = useState(false);
	const [loadingGoogle, setLoadingGoogle] = useState(false);
	const [loadingPasskey, setLoadingPasskey] = useState(false);
	const [passkeySupported, setPasskeySupported] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (typeof PublicKeyCredential === "undefined") return;

		setPasskeySupported(true);
	}, []);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		await authClient.signIn.email(
			{
				email,
				password,
				callbackURL: "/dashboard",
				rememberMe: false,
			},
			{
				onRequest: () => {
					setError("");
					setLoadingEmail(true);
				},
				onSuccess: () => {
					setLoadingEmail(false);
					toast.success("Login realizado com sucesso!");
					router.replace("/dashboard");
				},
				onError: (ctx) => {
					if (
						ctx.error.status === 500 &&
						ctx.error.statusText === "Internal Server Error"
					) {
						toast.error(
							"Ocorreu uma falha na requisição. Tente novamente mais tarde.",
						);
					}

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

	async function handlePasskey() {
		setError("");
		setLoadingPasskey(true);

		const { error: passkeyError } = await authClient.signIn.passkey({
			fetchOptions: {
				onSuccess: () => {
					setLoadingPasskey(false);
					router.replace("/dashboard");
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setLoadingPasskey(false);
				},
			},
		});

		if (passkeyError) {
			setError(passkeyError.message || "Erro ao entrar com passkey.");
			setLoadingPasskey(false);
		}
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
							title="Entrar no OpenMonetis"
							description="Acesse sua conta para acompanhar cartões, lançamentos e metas em um só lugar."
						/>

						<AuthErrorAlert error={error} />

						<Field>
							<FieldLabel htmlFor="email">E-mail</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="Digite seu e-mail"
								autoComplete="username webauthn"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								aria-invalid={!!error}
							/>
						</Field>

						<Field>
							<div className="flex items-center">
								<FieldLabel htmlFor="password">Senha</FieldLabel>
							</div>
							<Input
								id="password"
								type="password"
								required
								placeholder="Digite sua senha"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								aria-invalid={!!error}
							/>
						</Field>

						<Field>
							<Button
								type="submit"
								disabled={loadingEmail || loadingGoogle || loadingPasskey}
								className="w-full"
							>
								{loadingEmail ? (
									<RiLoader4Line className="h-4 w-4 animate-spin" />
								) : (
									"Entrar"
								)}
							</Button>
						</Field>

						<FieldSeparator className="my-1.5 *:data-[slot=field-separator-content]:bg-card">
							Ou continue com
						</FieldSeparator>

						<Field>
							<div
								className={cn(
									passkeySupported ? "grid grid-cols-2 gap-2" : "flex",
								)}
							>
								<GoogleAuthButton
									onClick={handleGoogle}
									loading={loadingGoogle}
									disabled={
										loadingEmail ||
										loadingGoogle ||
										loadingPasskey ||
										!isGoogleAvailable
									}
									text="Google"
								/>

								{passkeySupported && (
									<Button
										variant="outline"
										type="button"
										onClick={handlePasskey}
										disabled={loadingEmail || loadingGoogle || loadingPasskey}
										className="w-full gap-2"
									>
										{loadingPasskey ? (
											<RiLoader4Line className="h-4 w-4 animate-spin" />
										) : (
											<RiFingerprintLine className="h-5 w-5" />
										)}
										<span>Passkey</span>
									</Button>
								)}
							</div>
						</Field>

						<FieldDescription className="pt-1 text-center">
							Não tem uma conta?{" "}
							<a href="/signup" className={authLinkClassName}>
								Inscreva-se
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
