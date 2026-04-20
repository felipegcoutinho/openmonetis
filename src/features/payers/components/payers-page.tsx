"use client";

import { RiAddFill } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deletePayerAction,
	joinPayerByShareCodeAction,
} from "@/features/payers/actions";
import { PayerCard } from "@/features/payers/components/payer-card";
import { PayerDialog } from "@/features/payers/components/payer-dialog";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import type { Payer } from "./types";

interface PayersPageProps {
	payers: Payer[];
	avatarOptions: string[];
}

export function PayersPage({ payers, avatarOptions }: PayersPageProps) {
	const router = useRouter();
	const [editOpen, setEditOpen] = useState(false);
	const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [payerToRemove, setPayerToRemove] = useState<Payer | null>(null);
	const [shareCodeInput, setShareCodeInput] = useState("");
	const [joinPending, startJoin] = useTransition();

	const orderedPayers = useMemo(
		() =>
			[...payers].sort((a, b) => {
				// Admin sempre primeiro
				if (a.role === PAYER_ROLE_ADMIN && b.role !== PAYER_ROLE_ADMIN) {
					return -1;
				}
				if (a.role !== PAYER_ROLE_ADMIN && b.role === PAYER_ROLE_ADMIN) {
					return 1;
				}
				// Se ambos têm o mesmo tipo de role, ordena por nome
				return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
			}),
		[payers],
	);

	const handleEdit = (payer: Payer) => {
		setSelectedPayer(payer);
		setEditOpen(true);
	};

	const handleEditOpenChange = (open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedPayer(null);
		}
	};

	const handleRemoveRequest = (payer: Payer) => {
		if (payer.role === PAYER_ROLE_ADMIN) {
			toast.error("Pessoas administradoras não podem ser removidas.");
			return;
		}
		setPayerToRemove(payer);
		setRemoveOpen(true);
	};

	const handleRemoveOpenChange = (open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setPayerToRemove(null);
		}
	};

	const handleRemoveConfirm = async () => {
		if (!payerToRemove) {
			return;
		}

		const result = await deletePayerAction({ id: payerToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const removeTitle = payerToRemove
		? `Remover pessoa "${payerToRemove.name}"?`
		: "Remover pessoa?";

	const handleJoinByCode = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!shareCodeInput.trim()) {
			toast.error("Informe um código válido.");
			return;
		}

		startJoin(async () => {
			const result = await joinPayerByShareCodeAction({
				code: shareCodeInput.trim(),
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			toast.success(result.message);
			setShareCodeInput("");
			router.refresh();
		});
	};

	return (
		<>
			<div className="flex flex-col gap-6 w-full">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<PayerDialog
						mode="create"
						avatarOptions={avatarOptions}
						trigger={
							<Button className="w-full sm:w-auto">
								<RiAddFill className="size-4" />
								Nova pessoa
							</Button>
						}
					/>
					<form
						onSubmit={handleJoinByCode}
						className="flex w-full flex-row items-center justify-center gap-2 sm:w-auto"
					>
						<Input
							placeholder="Código de Compartilhamento"
							value={shareCodeInput}
							onChange={(event) => setShareCodeInput(event.target.value)}
							disabled={joinPending}
							className="w-full sm:w-56 border-dashed"
						/>
						<Button type="submit" disabled={joinPending}>
							{joinPending ? "Adicionando..." : "Adicionar por código"}
						</Button>
					</form>
				</div>

				{orderedPayers.length === 0 ? (
					<div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
						<div className="max-w-sm text-center text-sm text-muted-foreground">
							Cadastre seu primeira pessoa para organizar cobranças e pagamentos
							recorrentes.
						</div>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{orderedPayers.map((payer) => (
							<PayerCard
								key={payer.id}
								payer={payer}
								onEdit={payer.canEdit ? () => handleEdit(payer) : undefined}
								onRemove={
									payer.canEdit && payer.role !== PAYER_ROLE_ADMIN
										? () => handleRemoveRequest(payer)
										: undefined
								}
							/>
						))}
					</div>
				)}
			</div>

			<PayerDialog
				mode="update"
				payer={selectedPayer ?? undefined}
				avatarOptions={avatarOptions}
				open={editOpen && !!selectedPayer}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!payerToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Ao remover esta pessoa, os registros relacionados a ele deixarão de ser associados automaticamente."
				confirmLabel="Remover"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>
		</>
	);
}
