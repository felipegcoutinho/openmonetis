"use client";

import { RiCalendarCheckLine, RiCloseLine, RiEyeLine } from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransition } from "react";
import { toast } from "sonner";
import { cancelInstallmentAnticipationAction } from "@/features/transactions/anticipation-actions";
import type { InstallmentAnticipationListItem } from "@/features/transactions/hooks/use-installment-anticipations";
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
import { displayPeriod } from "@/shared/utils/period";

interface AnticipationCardProps {
	anticipation: InstallmentAnticipationListItem;
	onViewLancamento?: (transactionId: string) => void;
	onCanceled?: () => void;
}

export function AnticipationCard({
	anticipation,
	onViewLancamento,
	onCanceled,
}: AnticipationCardProps) {
	const [isPending, startTransition] = useTransition();

	const isSettled = anticipation.transaction?.isSettled === true;
	const canCancel = !isSettled;

	const formatDate = (date: string) => {
		return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
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
		onViewLancamento?.(anticipation.transactionId);
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
						<dd className="mt-1 font-medium">
							<MoneyValues amount={Number(anticipation.totalAmount)} />
						</dd>
					</div>

					{Number(anticipation.discount) > 0 && (
						<div>
							<dt className="text-muted-foreground">Desconto</dt>
							<dd className="mt-1 font-medium text-success">
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
						<dd className="mt-1 text-lg font-semibold text-primary">
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

					{anticipation.payer && (
						<div>
							<dt className="text-muted-foreground">Pagador</dt>
							<dd className="mt-1 font-medium">{anticipation.payer.name}</dd>
						</div>
					)}

					{anticipation.category && (
						<div>
							<dt className="text-muted-foreground">Categoria</dt>
							<dd className="mt-1 font-medium">{anticipation.category.name}</dd>
						</div>
					)}
				</dl>

				{anticipation.note && (
					<div className="rounded-lg border p-3">
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
