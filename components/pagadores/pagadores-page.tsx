"use client";

import { RiAddCircleLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deletePagadorAction,
	joinPagadorByShareCodeAction,
} from "@/app/(dashboard)/pagadores/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { PagadorCard } from "@/components/pagadores/pagador-card";
import { PagadorDialog } from "@/components/pagadores/pagador-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import type { Pagador } from "./types";

interface PagadoresPageProps {
	pagadores: Pagador[];
	avatarOptions: string[];
}

export function PagadoresPage({
	pagadores,
	avatarOptions,
}: PagadoresPageProps) {
	const router = useRouter();
	const [editOpen, setEditOpen] = useState(false);
	const [selectedPagador, setSelectedPagador] = useState<Pagador | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [pagadorToRemove, setPagadorToRemove] = useState<Pagador | null>(null);
	const [shareCodeInput, setShareCodeInput] = useState("");
	const [joinPending, startJoin] = useTransition();

	const orderedPagadores = useMemo(
		() =>
			[...pagadores].sort((a, b) => {
				// Admin sempre primeiro
				if (a.role === PAGADOR_ROLE_ADMIN && b.role !== PAGADOR_ROLE_ADMIN) {
					return -1;
				}
				if (a.role !== PAGADOR_ROLE_ADMIN && b.role === PAGADOR_ROLE_ADMIN) {
					return 1;
				}
				// Se ambos têm o mesmo tipo de role, ordena por nome
				return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
			}),
		[pagadores],
	);

	const handleEdit = useCallback((pagador: Pagador) => {
		setSelectedPagador(pagador);
		setEditOpen(true);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedPagador(null);
		}
	}, []);

	const handleRemoveRequest = useCallback((pagador: Pagador) => {
		if (pagador.role === PAGADOR_ROLE_ADMIN) {
			toast.error("Pagadores administradores não podem ser removidos.");
			return;
		}
		setPagadorToRemove(pagador);
		setRemoveOpen(true);
	}, []);

	const handleRemoveOpenChange = useCallback((open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setPagadorToRemove(null);
		}
	}, []);

	const handleRemoveConfirm = useCallback(async () => {
		if (!pagadorToRemove) {
			return;
		}

		const result = await deletePagadorAction({ id: pagadorToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [pagadorToRemove]);

	const removeTitle = pagadorToRemove
		? `Remover pagador "${pagadorToRemove.name}"?`
		: "Remover pagador?";

	const handleJoinByCode = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!shareCodeInput.trim()) {
				toast.error("Informe um código válido.");
				return;
			}

			startJoin(async () => {
				const result = await joinPagadorByShareCodeAction({
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
		},
		[shareCodeInput, router],
	);

	return (
		<>
			<div className="flex flex-col gap-6 w-full">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<PagadorDialog
						mode="create"
						avatarOptions={avatarOptions}
						trigger={
							<Button className="w-full sm:w-auto">
								<RiAddCircleLine className="size-4" />
								Novo pagador
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

				{orderedPagadores.length === 0 ? (
					<div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
						<div className="max-w-sm text-center text-sm text-muted-foreground">
							Cadastre seu primeiro pagador para organizar cobranças e
							pagamentos recorrentes.
						</div>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{orderedPagadores.map((pagador) => (
							<PagadorCard
								key={pagador.id}
								pagador={pagador}
								onEdit={pagador.canEdit ? () => handleEdit(pagador) : undefined}
								onRemove={
									pagador.canEdit && pagador.role !== PAGADOR_ROLE_ADMIN
										? () => handleRemoveRequest(pagador)
										: undefined
								}
							/>
						))}
					</div>
				)}
			</div>

			<PagadorDialog
				mode="update"
				pagador={selectedPagador ?? undefined}
				avatarOptions={avatarOptions}
				open={editOpen && !!selectedPagador}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!pagadorToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Ao remover este pagador, os registros relacionados a ele deixarão de ser associados automaticamente."
				confirmLabel="Remover pagador"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>
		</>
	);
}
