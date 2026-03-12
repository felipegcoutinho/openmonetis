"use client";

import { RiCalendarCheckLine, RiCloseLine, RiEyeLine } from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransition } from "react";
import { toast } from "sonner";
import { cancelInstallmentAnticipationAction } from "@/features/transactions/anticipation-actions";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import type { InstallmentAnticipationWithRelations } from "@/shared/lib/installments/anticipation-types";
import { displayPeriod } from "@/shared/utils/period";

interface AnticipationCardProps {
	anticipation: InstallmentAnticipationWithRelations;
	onViewLancamento?: (lancamentoId: string) => void;
	onCanceled?: () => void;
}

export function AnticipationCard({
	anticipation,
	onViewLancamento,
	onCanceled,
}: AnticipationCardProps) {
	const [isPending, startTransition] = useTransition();

	const isSettled = anticipation.lancamento.isSettled === true;
	const canCancel = !isSettled;

	const formatDate = (date: Date) => {
		return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
	};

	const handleCancel = async () => {
		startTransition(async () => {
			const result = await cancelInstallmentAnticipationAction({
				anticipationId: anticipation.id,
			});

			if (result.success) {
				toast.success(result.message);
				onCanceled?.();
			} else {
				toast.error(result.error || "Erro ao cancelar antecipação");
			}
		});
	};

	const handleViewLancamento = () => {
		onViewLancamento?.(anticipation.lancamentoId);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
				<div className="space-y-1">
					<CardTitle className="text-base">
						{anticipation.installmentCount}{" "}
						{anticipation.installmentCount === 1
							? "parcela antecipada"
							: "parcelas antecipadas"}
					</CardTitle>
					<CardDescription>
						<RiCalendarCheckLine className="mr-1 inline size-3.5" />
						{formatDate(anticipation.anticipationDate)}
					</CardDescription>
				</div>
				<Badge variant="secondary">
					{displayPeriod(anticipation.anticipationPeriod)}
				</Badge>
			</CardHeader>

			<CardContent className="space-y-3">
				<dl className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt className="text-muted-foreground">Valor Original</dt>
						<dd className="mt-1 font-medium tabular-nums">
							<MoneyValues amount={Number(anticipation.totalAmount)} />
						</dd>
					</div>

					{Number(anticipation.discount) > 0 && (
						<div>
							<dt className="text-muted-foreground">Desconto</dt>
							<dd className="mt-1 font-medium tabular-nums text-success">
								- <MoneyValues amount={Number(anticipation.discount)} />
							</dd>
						</div>
					)}

					<div
						className={
							Number(anticipation.discount) > 0
								? "col-span-2 border-t pt-3"
								: ""
						}
					>
						<dt className="text-muted-foreground">
							{Number(anticipation.discount) > 0
								? "Valor Final"
								: "Valor Total"}
						</dt>
						<dd className="mt-1 text-lg font-semibold tabular-nums text-primary">
							<MoneyValues
								amount={
									Number(anticipation.totalAmount) < 0
										? Number(anticipation.totalAmount) +
											Number(anticipation.discount)
										: Number(anticipation.totalAmount) -
											Number(anticipation.discount)
								}
							/>
						</dd>
					</div>

					<div>
						<dt className="text-muted-foreground">Status do Lançamento</dt>
						<dd className="mt-1">
							<Badge variant={isSettled ? "success" : "outline"}>
								{isSettled ? "Pago" : "Pendente"}
							</Badge>
						</dd>
					</div>

					{anticipation.pagador && (
						<div>
							<dt className="text-muted-foreground">Pagador</dt>
							<dd className="mt-1 font-medium">{anticipation.pagador.name}</dd>
						</div>
					)}

					{anticipation.categoria && (
						<div>
							<dt className="text-muted-foreground">Categoria</dt>
							<dd className="mt-1 font-medium">
								{anticipation.categoria.name}
							</dd>
						</div>
					)}
				</dl>

				{anticipation.note && (
					<div className="rounded-lg border bg-muted/20 p-3">
						<dt className="text-xs font-medium text-muted-foreground">
							Observação
						</dt>
						<dd className="mt-1 text-sm">{anticipation.note}</dd>
					</div>
				)}
			</CardContent>

			<CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
				<Button
					variant="outline"
					size="sm"
					onClick={handleViewLancamento}
					disabled={isPending}
				>
					<RiEyeLine className="mr-2 size-4" />
					Ver Lançamento
				</Button>

				{canCancel && (
					<ConfirmActionDialog
						trigger={
							<Button variant="destructive" size="sm" disabled={isPending}>
								<RiCloseLine className="mr-2 size-4" />
								Cancelar Antecipação
							</Button>
						}
						title="Cancelar antecipação?"
						description="Esta ação irá reverter a antecipação e restaurar as parcelas originais. O lançamento de antecipação será removido."
						confirmLabel="Cancelar Antecipação"
						confirmVariant="destructive"
						pendingLabel="Cancelando..."
						onConfirm={handleCancel}
					/>
				)}

				{isSettled && (
					<div className="text-xs text-muted-foreground">
						Não é possível cancelar uma antecipação paga
					</div>
				)}
			</CardFooter>
		</Card>
	);
}
