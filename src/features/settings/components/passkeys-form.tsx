"use client";

import {
	RiAddLine,
	RiAlertLine,
	RiDeleteBinLine,
	RiFingerprintLine,
	RiLoader4Line,
	RiPencilLine,
} from "@remixicon/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { authClient } from "@/shared/lib/auth/client";

interface Passkey {
	id: string;
	name: string | null;
	deviceType: string;
	createdAt: Date | null;
}

export function PasskeysForm() {
	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [passkeySupported, setPasskeySupported] = useState(false);

	// Add passkey
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addName, setAddName] = useState("");
	const [isAdding, setIsAdding] = useState(false);

	// Rename passkey
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);

	// Delete passkey
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const isMutating = isAdding || isRenaming || isDeleting;

	const fetchPasskeys = useCallback(
		async (options?: { showLoader?: boolean }) => {
			const showLoader = options?.showLoader ?? true;
			if (showLoader) setIsLoading(true);
			setError(null);
			try {
				const { data, error: fetchError } =
					await authClient.passkey.listUserPasskeys();
				if (fetchError) {
					setError(fetchError.message || "Erro ao carregar passkeys.");
					return;
				}
				setPasskeys(
					(data ?? []).map((p) => ({
						id: p.id,
						name: p.name,
						deviceType: p.deviceType,
						createdAt: p.createdAt ? new Date(p.createdAt) : null,
					})),
				);
			} catch {
				setError("Erro ao carregar passkeys.");
			} finally {
				if (showLoader) setIsLoading(false);
			}
		},
		[],
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setPasskeySupported(typeof PublicKeyCredential !== "undefined");
		fetchPasskeys();
	}, [fetchPasskeys]);

	const handleAdd = async () => {
		if (!passkeySupported) {
			setError("Passkeys não são suportadas neste navegador/dispositivo.");
			return;
		}
		setIsAdding(true);
		setError(null);
		try {
			const { error: addError } = await authClient.passkey.addPasskey({
				name: addName.trim() || undefined,
			});
			if (addError) {
				setError(addError.message || "Erro ao registrar passkey.");
				return;
			}
			setAddName("");
			setIsAddOpen(false);
			await fetchPasskeys({ showLoader: false });
		} catch {
			setError("Erro ao registrar passkey.");
		} finally {
			setIsAdding(false);
		}
	};

	const handleRename = async (id: string) => {
		if (!editName.trim()) return;
		setIsRenaming(true);
		setError(null);
		try {
			const { error: renameError } = await authClient.passkey.updatePasskey({
				id,
				name: editName.trim(),
			});
			if (renameError) {
				setError(renameError.message || "Erro ao renomear passkey.");
				return;
			}
			setEditingId(null);
			setEditName("");
			await fetchPasskeys({ showLoader: false });
		} catch {
			setError("Erro ao renomear passkey.");
		} finally {
			setIsRenaming(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		setError(null);
		try {
			const { error: deleteError } = await authClient.passkey.deletePasskey({
				id: deleteId,
			});
			if (deleteError) {
				setError(deleteError.message || "Erro ao remover passkey.");
				return;
			}
			setDeleteId(null);
			await fetchPasskeys({ showLoader: false });
		} catch {
			setError("Erro ao remover passkey.");
		} finally {
			setIsDeleting(false);
		}
	};

	const startEditing = (passkey: Passkey) => {
		setEditingId(passkey.id);
		setEditName(passkey.name || "");
	};

	const cancelEditing = () => {
		setEditingId(null);
		setEditName("");
	};

	const deviceTypeLabel = (type: string) => {
		switch (type) {
			case "singleDevice":
				return "Dispositivo único";
			case "multiDevice":
				return "Multi-dispositivo";
			default:
				return type;
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium">Suas passkeys</h3>
					<p className="text-sm text-muted-foreground">
						Gerencie suas passkeys para login sem senha.
					</p>
				</div>
				<Dialog
					open={isAddOpen}
					onOpenChange={(open) => {
						if (!open) {
							setAddName("");
							setError(null);
						}
						setIsAddOpen(open);
					}}
				>
					<DialogTrigger asChild>
						<Button size="sm" disabled={isMutating || !passkeySupported}>
							<RiAddLine className="h-4 w-4 mr-1" />
							Adicionar
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Registrar Passkey</DialogTitle>
							<DialogDescription>
								Dê um nome para identificar esta passkey (opcional). Em seguida,
								seu navegador solicitará a confirmação biométrica.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="passkeyName">Nome (opcional)</Label>
								<Input
									id="passkeyName"
									placeholder="Ex: MacBook Pro, iPhone..."
									value={addName}
									onChange={(e) => setAddName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											void handleAdd();
										}
									}}
									disabled={isAdding}
								/>
							</div>
							{error && (
								<div className="flex items-center gap-2 text-sm text-destructive">
									<RiAlertLine className="h-4 w-4" />
									{error}
								</div>
							)}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsAddOpen(false)}
								disabled={isAdding}
							>
								Cancelar
							</Button>
							<Button onClick={handleAdd} disabled={isAdding}>
								{isAdding ? (
									<>
										<RiLoader4Line className="h-4 w-4 animate-spin mr-1" />
										Registrando...
									</>
								) : (
									"Registrar"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{error && !isAddOpen && (
				<div className="flex items-center gap-2 text-sm text-destructive">
					<RiAlertLine className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}
			{!passkeySupported && !isLoading && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<RiAlertLine className="h-4 w-4 shrink-0" />
					Este navegador/dispositivo não suporta passkeys.
				</div>
			)}

			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<RiLoader4Line className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			) : passkeys.length === 0 ? (
				<div className="flex items-center gap-3 py-4 text-muted-foreground">
					<RiFingerprintLine className="h-5 w-5" />
					<p className="text-sm">
						Nenhuma passkey cadastrada. Adicione uma para login sem senha.
					</p>
				</div>
			) : (
				<div className="divide-y py-2">
					{passkeys.map((pk) => (
						<div
							key={pk.id}
							className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
						>
							<div className="flex items-center gap-3 min-w-0">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
									<RiFingerprintLine className="h-4 w-4" />
								</div>
								<div className="min-w-0">
									{editingId === pk.id ? (
										<div className="flex items-center gap-2">
											<Input
												className="h-7 text-sm w-40"
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleRename(pk.id);
													if (e.key === "Escape") cancelEditing();
												}}
												autoFocus
												disabled={isRenaming}
											/>
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-2"
												onClick={() => handleRename(pk.id)}
												disabled={isRenaming || !editName.trim()}
											>
												{isRenaming ? (
													<RiLoader4Line className="h-3 w-3 animate-spin" />
												) : (
													"Salvar"
												)}
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-2"
												onClick={cancelEditing}
												disabled={isRenaming}
											>
												Cancelar
											</Button>
										</div>
									) : (
										<>
											<div className="flex items-center gap-2">
												<span className="text-sm font-bold truncate">
													{pk.name || "Passkey sem nome"}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-5 w-5 text-muted-foreground hover:text-foreground"
													onClick={() => startEditing(pk)}
													disabled={isMutating}
												>
													<RiPencilLine className="h-3 w-3" />
												</Button>
											</div>
											<p className="text-xs text-muted-foreground py-1">
												{deviceTypeLabel(pk.deviceType)}
												{pk.createdAt
													? ` · Criada ${formatDistanceToNow(pk.createdAt, {
															addSuffix: true,
															locale: ptBR,
														})}`
													: " · Data de criação indisponível"}
											</p>
										</>
									)}
								</div>
							</div>
							{editingId !== pk.id && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									onClick={() => setDeleteId(pk.id)}
									disabled={isMutating}
								>
									<RiDeleteBinLine className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remover passkey?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta passkey não poderá mais ser usada para login. Esta ação não
							pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isDeleting ? "Removendo..." : "Remover"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
