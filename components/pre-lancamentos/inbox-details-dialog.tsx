"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { InboxItem } from "./types";

interface InboxDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: InboxItem | null;
}

export function InboxDetailsDialog({
	open,
	onOpenChange,
	item,
}: InboxDetailsDialogProps) {
	if (!item) return null;

	const amount = item.parsedAmount ? parseFloat(item.parsedAmount) : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Detalhes da Notificação</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Dados da fonte */}
					<div>
						<div className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">ID</span>
								<span className="font-mono text-xs">{item.id}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">App</span>
								<span>{item.sourceAppName || item.sourceApp}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Package</span>
								<span className="font-mono text-xs">{item.sourceApp}</span>
							</div>
						</div>
					</div>

					<Separator />

					{/* Texto original */}
					<div>
						<h4 className="mb-1 text-sm font-medium text-muted-foreground">
							Notificação Original
						</h4>

						{item.originalTitle && (
							<p className="mb-1 font-medium">{item.originalTitle}</p>
						)}
						<p className="text-sm">{item.originalText}</p>
					</div>

					<Separator />

					{/* Dados parseados */}
					<div>
						<div className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Estabelecimento</span>
								<span>{item.parsedName || "Não extraído"}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Valor</span>
								{amount !== null ? (
									<MoneyValues amount={amount} className="text-sm" />
								) : (
									<span className="text-muted-foreground">Não extraído</span>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* Metadados */}
					<div>
						<div className="grid gap-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Status</span>
								<Badge variant="outline">{item.status}</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Criado em</span>
								<span>
									{format(new Date(item.createdAt), "PPpp", { locale: ptBR })}
								</span>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button">Entendi</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
