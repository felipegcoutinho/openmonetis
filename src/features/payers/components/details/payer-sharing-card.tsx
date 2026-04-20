"use client";

import { RiDeleteBin5Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deletePayerShareAction,
	regeneratePayerShareCodeAction,
} from "@/features/payers/actions";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";

type PagadorShare = {
	id: string;
	userId: string;
	name: string;
	email: string;
	createdAt: string;
};

interface PagadorSharingCardProps {
	payerId: string;
	shareCode: string;
	shares: PagadorShare[];
}

export function PayerSharingCard({
	payerId,
	shareCode,
	shares,
}: PagadorSharingCardProps) {
	const router = useRouter();
	const [currentCode, setCurrentCode] = useState(shareCode);
	const [regeneratePending, startRegenerate] = useTransition();
	const [removePendingId, setRemovePendingId] = useState<string | null>(null);

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(currentCode);
			toast.success("Código copiado para a área de transferência.");
		} catch {
			toast.error("Não foi possível copiar o código.");
		}
	};

	const handleRegenerate = () => {
		startRegenerate(async () => {
			const result = await regeneratePayerShareCodeAction({ payerId });

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			if ("code" in result) setCurrentCode(result.code);
			toast.success("Novo código gerado com sucesso.");
			router.refresh();
		});
	};

	const handleRemove = (shareId: string) => {
		setRemovePendingId(shareId);
		startRegenerate(async () => {
			const result = await deletePayerShareAction({ shareId });

			if (!result.success) {
				toast.error(result.error);
				setRemovePendingId(null);
				return;
			}

			toast.success(result.message);
			setRemovePendingId(null);
			router.refresh();
		});
	};

	return (
		<Card className="border">
			<CardHeader>
				<CardTitle className="text-lg font-semibold">
					Compartilhamentos
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					Compartilhe o código abaixo com outra pessoa. Ela poderá adicioná-lo
					na página de pessoas usando a opção Adicionar por código para ter
					acesso somente leitura.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm">
					<span className="text-xs font-medium uppercase text-muted-foreground/80">
						Código de compartilhamento
					</span>
					<div className="flex flex-wrap items-center gap-2">
						<code className="rounded bg-muted px-2 py-1 text-xs font-mono">
							{currentCode}
						</code>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={handleCopyCode}
						>
							Copiar
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleRegenerate}
							disabled={regeneratePending}
						>
							{regeneratePending ? "Gerando..." : "Gerar novo código"}
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						Gerar um novo código não remove acessos existentes, apenas impede
						que novos convites usem o código anterior.
					</p>
				</div>

				{shares.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhum usuário com acesso de leitura.
					</p>
				) : (
					<ul className="space-y-3">
						{shares.map((share) => (
							<li
								key={share.id}
								className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm"
							>
								<div className="flex flex-col">
									<span className="font-medium text-foreground">
										{share.name}
									</span>
									<span className="text-muted-foreground">{share.email}</span>
									<span className="text-xs text-muted-foreground/80">
										ID: ****{share.userId.slice(-4)}
									</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => handleRemove(share.id)}
									disabled={removePendingId === share.id}
								>
									<RiDeleteBin5Line className="size-4" />
									<span className="sr-only">Remover acesso</span>
								</Button>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
