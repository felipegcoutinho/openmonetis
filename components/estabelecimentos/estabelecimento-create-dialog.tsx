"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createEstabelecimentoAction } from "@/app/(dashboard)/estabelecimentos/actions";
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
import { RiAddCircleLine } from "@remixicon/react";

interface EstabelecimentoCreateDialogProps {
	trigger?: React.ReactNode;
}

export function EstabelecimentoCreateDialog({
	trigger,
}: EstabelecimentoCreateDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;

		startTransition(async () => {
			const result = await createEstabelecimentoAction({ name: trimmed });
			if (result.success) {
				toast.success(result.message);
				setName("");
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button>
						<RiAddCircleLine className="size-4" />
						Novo estabelecimento
					</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Novo estabelecimento</DialogTitle>
						<DialogDescription>
							Adicione um nome para usar nos lançamentos. Ele aparecerá na lista
							e nas sugestões ao criar ou editar lançamentos.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="estabelecimento-name">Nome</Label>
							<Input
								id="estabelecimento-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: Supermercado, Posto, Farmácia"
								disabled={isPending}
								autoFocus
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending || !name.trim()}>
							{isPending ? "Salvando…" : "Criar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
