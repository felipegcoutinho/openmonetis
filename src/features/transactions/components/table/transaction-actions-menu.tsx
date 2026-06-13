"use client";

import {
	RiCheckLine,
	RiDeleteBin5Line,
	RiFileCopyLine,
	RiFileList2Line,
	RiHistoryLine,
	RiMoreFill,
	RiPencilLine,
	RiRefundLine,
	RiTimeLine,
} from "@remixicon/react";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { REFUND_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { CREDIT_CARD_PAYMENT_METHOD } from "@/features/transactions/lib/constants";
import { detectInstallmentFromName } from "@/features/transactions/lib/installment-detection";
import { getConditionIcon } from "@/shared/utils/icons";
import type { TransactionItem } from "../types";

type TransactionActionsMenuProps = {
	item: TransactionItem;
	currentUserId: string;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onRefund?: (item: TransactionItem) => void;
	onAnticipate?: (item: TransactionItem) => void;
	onViewAnticipationHistory?: (item: TransactionItem) => void;
	onConvertToInstallment?: (item: TransactionItem) => void;
	onConvertToRecurring?: (item: TransactionItem) => void;
};

export function TransactionActionsMenu({
	item,
	currentUserId,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onViewDetails,
	onRefund,
	onAnticipate,
	onViewAnticipationHistory,
	onConvertToInstallment,
	onConvertToRecurring,
}: TransactionActionsMenuProps) {
	const isOwnData = item.userId === currentUserId;
	const canRefund =
		isOwnData &&
		item.transactionType === "Despesa" &&
		item.condition === "À vista" &&
		!item.splitGroupId &&
		!item.readonly &&
		!item.note?.startsWith(REFUND_NOTE_PREFIX);

	const showInstallmentActions =
		isOwnData && item.condition === "Parcelado" && item.seriesId;

	const detectedInstallment = detectInstallmentFromName(item.name);
	const canConvertToInstallment =
		isOwnData &&
		item.paymentMethod === CREDIT_CARD_PAYMENT_METHOD &&
		item.condition === "À vista" &&
		!item.splitGroupId &&
		!item.isDivided &&
		!item.readonly &&
		Boolean(detectedInstallment) &&
		Boolean(onConvertToInstallment);

	const canConvertToRecurring =
		isOwnData &&
		item.condition === "À vista" &&
		!item.splitGroupId &&
		!item.isDivided &&
		!item.readonly &&
		Boolean(onConvertToRecurring);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon-sm">
					<RiMoreFill className="size-4" aria-hidden />
					<span className="sr-only">Abrir ações do lançamento</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuItem
					onSelect={() => onViewDetails?.(item)}
					disabled={!onViewDetails}
				>
					<RiFileList2Line className="size-4" aria-hidden />
					Detalhes
				</DropdownMenuItem>

				{isOwnData ? (
					<DropdownMenuItem
						onSelect={() => onEdit?.(item)}
						disabled={item.readonly || !onEdit}
					>
						<RiPencilLine className="size-4" aria-hidden />
						Editar
					</DropdownMenuItem>
				) : null}

				{!item.readonly && isOwnData ? (
					<DropdownMenuItem onSelect={() => onCopy?.(item)} disabled={!onCopy}>
						<RiFileCopyLine className="size-4" aria-hidden />
						Copiar
					</DropdownMenuItem>
				) : null}

				{!isOwnData ? (
					<DropdownMenuItem
						onSelect={() => onImport?.(item)}
						disabled={!onImport}
					>
						<RiFileCopyLine className="size-4" aria-hidden />
						Importar para Minha Conta
					</DropdownMenuItem>
				) : null}

				{canRefund ? (
					<DropdownMenuItem
						onSelect={() => onRefund?.(item)}
						disabled={!onRefund}
					>
						<RiRefundLine className="size-4" aria-hidden />
						Reembolso
					</DropdownMenuItem>
				) : null}

				{canConvertToInstallment ? (
					<DropdownMenuItem
						onSelect={() => onConvertToInstallment?.(item)}
					>
						{getConditionIcon("Parcelado")}
						Converter em Parcelamento
					</DropdownMenuItem>
				) : null}

				{canConvertToRecurring ? (
					<DropdownMenuItem
						onSelect={() => onConvertToRecurring?.(item)}
					>
						{getConditionIcon("Recorrente")}
						Converter em Recorrente
					</DropdownMenuItem>
				) : null}

				{isOwnData ? (
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => onConfirmDelete?.(item)}
						disabled={item.readonly || !onConfirmDelete}
					>
						<RiDeleteBin5Line className="size-4" aria-hidden />
						Remover
					</DropdownMenuItem>
				) : null}

				{showInstallmentActions ? (
					<>
						<DropdownMenuSeparator />

						{!item.isAnticipated && onAnticipate ? (
							<DropdownMenuItem onSelect={() => onAnticipate(item)}>
								<RiTimeLine className="size-4" aria-hidden />
								Antecipar Parcelas
							</DropdownMenuItem>
						) : null}

						{onViewAnticipationHistory ? (
							<DropdownMenuItem
								onSelect={() => onViewAnticipationHistory(item)}
							>
								<RiHistoryLine className="size-4" aria-hidden />
								Histórico de Antecipações
							</DropdownMenuItem>
						) : null}

						{item.isAnticipated ? (
							<DropdownMenuItem disabled>
								<RiCheckLine className="size-4 text-success" aria-hidden />
								Parcela Antecipada
							</DropdownMenuItem>
						) : null}
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
