"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/(dashboard)/ajustes/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export function DeleteAccountForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [confirmation, setConfirmation] = useState("");

	const handleDelete = () => {
		startTransition(async () => {
			const result = await deleteAccountAction({
				confirmation,
			});

			if (result.success) {
				toast.success(result.message);
				// Fazer logout e redirecionar para página de login
				await authClient.signOut();
				router.push("/");
			} else {
				toast.error(result.error);
			}
		});
	};

	const handleOpenModal = () => {
		setConfirmation("");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		if (isPending) return;
		setConfirmation("");
		setIsModalOpen(false);
	};

	return (
		<>
			<div className="flex flex-col space-y-6">
				<div className="space-y-4 max-w-md">
					<ul className="list-disc list-inside text-sm text-destructive space-y-1">
						<li>Lançamentos, orçamentos e anotações</li>
						<li>Contas, cartões e categorias</li>
						<li>Pagadores (incluindo o pagador padrão)</li>
						<li>Preferências e configurações</li>
						<li className="font-bold">
							Resumindo tudo, sua conta será permanentemente removida
						</li>
					</ul>
				</div>

				<div className="flex justify-end">
					<Button
						variant="destructive"
						onClick={handleOpenModal}
						disabled={isPending}
						className="w-fit"
					>
						Deletar conta
					</Button>
				</div>
			</div>

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
						<DialogTitle>Você tem certeza?</DialogTitle>
						<DialogDescription>
							Essa ação não pode ser desfeita. Isso irá deletar permanentemente
							sua conta e remover seus dados de nossos servidores.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="confirmation">
								Para confirmar, digite <strong>DELETAR</strong> no campo abaixo.
							</Label>
							<Input
								id="confirmation"
								value={confirmation}
								onChange={(e) => setConfirmation(e.target.value)}
								disabled={isPending}
								placeholder="DELETAR"
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
							variant="destructive"
							onClick={handleDelete}
							disabled={isPending || confirmation !== "DELETAR"}
						>
							{isPending ? "Deletando..." : "Deletar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
