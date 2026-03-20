"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteAccountAction,
	resetAccountAction,
} from "@/features/settings/actions";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { authClient } from "@/shared/lib/auth/client";

const RESET_CONFIRMATION = "ZERAR";
const DELETE_CONFIRMATION = "DELETAR";

type DangerAction = "reset" | "delete";

export function DeleteAccountForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [dangerAction, setDangerAction] = useState<DangerAction | null>(null);
	const [confirmation, setConfirmation] = useState("");

	const handleAction = () => {
		if (!dangerAction) return;

		const currentAction = dangerAction;

		startTransition(async () => {
			const result =
				currentAction === "reset"
					? await resetAccountAction({
							confirmation: confirmation as typeof RESET_CONFIRMATION,
						})
					: await deleteAccountAction({
							confirmation: confirmation as typeof DELETE_CONFIRMATION,
						});

			if (result.success) {
				toast.success(result.message);

				if (currentAction === "delete") {
					await authClient.signOut();
					router.push("/");
					return;
				}

				setConfirmation("");
				setDangerAction(null);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	};

	const handleOpenModal = (action: DangerAction) => {
		setConfirmation("");
		setDangerAction(action);
	};

	const handleCloseModal = () => {
		if (isPending) return;
		setConfirmation("");
		setDangerAction(null);
	};

	const confirmationWord =
		dangerAction === "reset" ? RESET_CONFIRMATION : DELETE_CONFIRMATION;
	const isResetAction = dangerAction === "reset";

	return (
		<>
			<div className="flex flex-col space-y-6">
				<div className="rounded-lg border p-4">
					<div className="space-y-4">
						<div>
							<h3 className="font-semibold">Zerar conta</h3>
							<p className="text-sm text-muted-foreground">
								Apaga todos os dados do OpenMonetis e deixa sua conta no estado
								inicial, mantendo seu login e credenciais de acesso.
							</p>
						</div>

						<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
							<li>Lançamentos, faturas, antecipações e pré-lançamentos</li>
							<li>Contas, cartões, orçamentos e anotações</li>
							<li>Pagadores próprios e compartilhamentos recebidos</li>
							<li>
								Preferências do app, insights salvos e tokens do Companion
							</li>
							<li className="font-medium text-foreground">
								Categorias padrão e pagador admin serão recriados
								automaticamente
							</li>
						</ul>

						<div className="flex justify-end">
							<Button
								variant="outline"
								onClick={() => handleOpenModal("reset")}
								disabled={isPending}
								className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
							>
								Zerar conta
							</Button>
						</div>
					</div>
				</div>

				<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
					<div className="space-y-4">
						<div>
							<h3 className="font-semibold text-destructive">Deletar conta</h3>
							<p className="text-sm text-muted-foreground">
								Remove seu usuário e todos os dados associados de forma
								permanente.
							</p>
						</div>

						<ul className="list-disc list-inside text-sm text-destructive space-y-1">
							<li>Lançamentos, orçamentos e anotações</li>
							<li>Contas, cartões e categorias</li>
							<li>Pagadores, credenciais e configurações</li>
							<li className="font-bold">
								Resumindo tudo, sua conta será permanentemente removida
							</li>
						</ul>

						<div className="flex justify-end">
							<Button
								variant="destructive"
								onClick={() => handleOpenModal("delete")}
								disabled={isPending}
								className="w-fit"
							>
								Deletar conta
							</Button>
						</div>
					</div>
				</div>
			</div>

			<Dialog
				open={dangerAction !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						handleCloseModal();
					}
				}}
			>
				<DialogContent
					className="max-w-md"
					onEscapeKeyDown={(e) => {
						if (isPending) e.preventDefault();
					}}
					onPointerDownOutside={(e) => {
						if (isPending) e.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{isResetAction ? "Zerar sua conta?" : "Você tem certeza?"}
						</DialogTitle>
						<DialogDescription>
							{isResetAction
								? "Essa ação não pode ser desfeita. Todos os dados do app serão apagados e sua conta voltará ao estado inicial, mas seu login continuará existindo."
								: "Essa ação não pode ser desfeita. Isso irá deletar permanentemente sua conta e remover seus dados de nossos servidores."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="confirmation">
								Para confirmar, digite <strong>{confirmationWord}</strong> no
								campo abaixo.
							</Label>
							<Input
								id="confirmation"
								value={confirmation}
								onChange={(e) => setConfirmation(e.target.value)}
								disabled={isPending}
								placeholder={confirmationWord}
								autoComplete="off"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCloseModal}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							variant={isResetAction ? "outline" : "destructive"}
							onClick={handleAction}
							disabled={isPending || confirmation !== confirmationWord}
							className={
								isResetAction
									? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
									: undefined
							}
						>
							{isPending
								? isResetAction
									? "Zerando..."
									: "Deletando..."
								: isResetAction
									? "Zerar conta"
									: "Deletar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
