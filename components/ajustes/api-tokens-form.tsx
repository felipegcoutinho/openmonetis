"use client";

import {
	RiAddLine,
	RiAlertLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiFileCopyLine,
	RiSmartphoneLine,
} from "@remixicon/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
	createApiTokenAction,
	revokeApiTokenAction,
} from "@/app/(dashboard)/ajustes/actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiToken {
	id: string;
	name: string;
	tokenPrefix: string;
	lastUsedAt: Date | null;
	lastUsedIp: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

interface ApiTokensFormProps {
	tokens: ApiToken[];
}

export function ApiTokensForm({ tokens }: ApiTokensFormProps) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [tokenName, setTokenName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [newToken, setNewToken] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [revokeId, setRevokeId] = useState<string | null>(null);
	const [isRevoking, setIsRevoking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const activeTokens = tokens.filter((t) => !t.revokedAt);

	const handleCreate = async () => {
		if (!tokenName.trim()) return;

		setIsCreating(true);
		setError(null);

		try {
			const result = await createApiTokenAction({ name: tokenName.trim() });

			if (result.success && result.data?.token) {
				setNewToken(result.data.token);
				setTokenName("");
			} else {
				setError(result.error || "Erro ao criar token");
			}
		} catch {
			setError("Erro ao criar token");
		} finally {
			setIsCreating(false);
		}
	};

	const handleCopy = async () => {
		if (!newToken) return;

		try {
			await navigator.clipboard.writeText(newToken);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement("textarea");
			textArea.value = newToken;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleRevoke = async () => {
		if (!revokeId) return;

		setIsRevoking(true);

		try {
			const result = await revokeApiTokenAction({ tokenId: revokeId });

			if (!result.success) {
				setError(result.error || "Erro ao revogar token");
			}
		} catch {
			setError("Erro ao revogar token");
		} finally {
			setIsRevoking(false);
			setRevokeId(null);
		}
	};

	const handleCloseCreate = () => {
		setIsCreateOpen(false);
		setNewToken(null);
		setTokenName("");
		setError(null);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium">Dispositivos conectados</h3>
					<p className="text-sm text-muted-foreground">
						Gerencie os dispositivos que podem enviar notificações para o
						OpenMonetis.
					</p>
				</div>
				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						if (!open) handleCloseCreate();
						else setIsCreateOpen(true);
					}}
				>
					<DialogTrigger asChild>
						<Button size="sm">
							<RiAddLine className="h-4 w-4 mr-1" />
							Novo Token
						</Button>
					</DialogTrigger>
					<DialogContent>
						{!newToken ? (
							<>
								<DialogHeader>
									<DialogTitle>Criar Token de API</DialogTitle>
									<DialogDescription>
										Crie um token para conectar o OpenMonetis Companion no seu
										dispositivo Android.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label htmlFor="tokenName">Nome do dispositivo</Label>
										<Input
											id="tokenName"
											placeholder="Ex: Meu Celular, Galaxy S24..."
											value={tokenName}
											onChange={(e) => setTokenName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreate();
											}}
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
									<Button variant="outline" onClick={handleCloseCreate}>
										Cancelar
									</Button>
									<Button
										onClick={handleCreate}
										disabled={isCreating || !tokenName.trim()}
									>
										{isCreating ? "Criando..." : "Criar Token"}
									</Button>
								</DialogFooter>
							</>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>Token Criado</DialogTitle>
									<DialogDescription>
										Copie o token abaixo e cole no app OpenMonetis Companion.
										Este token
										<strong> não será exibido novamente</strong>.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label>Seu token de API</Label>
										<div className="relative">
											<Input
												value={newToken}
												readOnly
												className="pr-10 font-mono text-sm"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-0 top-0 h-full px-3"
												onClick={handleCopy}
											>
												{copied ? (
													<RiCheckLine className="h-4 w-4 text-success" />
												) : (
													<RiFileCopyLine className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>
									<div className="rounded-md bg-warning/10 p-3 text-sm text-warning">
										<p className="font-medium">Importante:</p>
										<ul className="list-disc list-inside mt-1 space-y-1">
											<li>Guarde este token em local seguro</li>
											<li>Ele não será exibido novamente</li>
											<li>Use-o para configurar o app Android</li>
										</ul>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleCloseCreate}>Fechar</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>

			{activeTokens.length === 0 ? (
				<div className="flex items-center gap-3 py-4 text-muted-foreground">
					<RiSmartphoneLine className="h-5 w-5" />
					<p className="text-sm">
						Nenhum dispositivo conectado. Crie um token para começar.
					</p>
				</div>
			) : (
				<div className="divide-y py-2">
					{activeTokens.map((token) => (
						<div
							key={token.id}
							className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
									<RiSmartphoneLine className="h-4 w-4" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-bold">{token.name}</span>
										<Badge variant="outline" className="text-xs font-mono">
											{token.tokenPrefix}...
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground py-1">
										{token.lastUsedAt ? (
											<>
												Usado{" "}
												{formatDistanceToNow(token.lastUsedAt, {
													addSuffix: true,
													locale: ptBR,
												})}
											</>
										) : (
											"Nunca usado"
										)}
										{" · "}
										Criado em{" "}
										{new Date(token.createdAt).toLocaleDateString("pt-BR")}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								onClick={() => setRevokeId(token.id)}
							>
								<RiDeleteBinLine className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Revoke Confirmation Dialog */}
			<AlertDialog
				open={!!revokeId}
				onOpenChange={(open) => !open && setRevokeId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Revogar token?</AlertDialogTitle>
						<AlertDialogDescription>
							O dispositivo associado a este token será desconectado e não
							poderá mais enviar notificações. Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRevoking}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRevoke}
							disabled={isRevoking}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isRevoking ? "Revogando..." : "Revogar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
