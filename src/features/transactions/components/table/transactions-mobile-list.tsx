"use client";

import {
	RiArrowLeftRightLine,
	RiArrowRightDownLine,
	RiArrowRightUpLine,
	RiAttachment2,
	RiCalendarEventLine,
	RiChat1Line,
	RiGroupLine,
	RiTimeLine,
} from "@remixicon/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { formatDate } from "@/shared/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";
import type { TransactionItem } from "../types";
import { TransactionActionsMenu } from "./transaction-actions-menu";
import { TransactionSettlementButton } from "./transaction-settlement-button";

type TransactionsMobileListProps = {
	data: TransactionItem[];
	currentUserId: string;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onRefund?: (item: TransactionItem) => void;
	onToggleSettlement?: (item: TransactionItem) => void;
	onAnticipate?: (item: TransactionItem) => void;
	onViewAnticipationHistory?: (item: TransactionItem) => void;
	onConvertToInstallment?: (item: TransactionItem) => void;
	onConvertToRecurring?: (item: TransactionItem) => void;
	isSettlementLoading: (id: string) => boolean;
	showActions?: boolean;
};

export function TransactionsMobileList({
	data,
	currentUserId,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onViewDetails,
	onRefund,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	onConvertToInstallment,
	onConvertToRecurring,
	isSettlementLoading,
	showActions = true,
}: TransactionsMobileListProps) {
	return (
		<div className="space-y-3 md:hidden">
			{data.map((item) => (
				<TransactionMobileCard
					key={item.id}
					item={item}
					currentUserId={currentUserId}
					onEdit={onEdit}
					onCopy={onCopy}
					onImport={onImport}
					onConfirmDelete={onConfirmDelete}
					onViewDetails={onViewDetails}
					onRefund={onRefund}
					onToggleSettlement={onToggleSettlement}
					onAnticipate={onAnticipate}
					onViewAnticipationHistory={onViewAnticipationHistory}
					onConvertToInstallment={onConvertToInstallment}
					onConvertToRecurring={onConvertToRecurring}
					isSettlementLoading={isSettlementLoading}
					showActions={showActions}
				/>
			))}
		</div>
	);
}

type TransactionMobileCardProps = Omit<TransactionsMobileListProps, "data"> & {
	item: TransactionItem;
};

function TransactionMobileCard({
	item,
	currentUserId,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onViewDetails,
	onRefund,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	onConvertToInstallment,
	onConvertToRecurring,
	isSettlementLoading,
	showActions = true,
}: TransactionMobileCardProps) {
	const installmentBadge =
		item.currentInstallment && item.installmentCount
			? `${item.currentInstallment} de ${item.installmentCount}`
			: null;
	const isBoleto = item.paymentMethod === "Boleto" && item.dueDate;
	const dueDateLabel =
		isBoleto && item.dueDate ? `Venc. ${formatDate(item.dueDate)}` : null;
	const hasNote = Boolean(item.note?.trim().length);
	const isLastInstallment =
		item.currentInstallment === item.installmentCount &&
		item.installmentCount &&
		item.installmentCount > 1;
	const isReceita = item.transactionType === "Receita";
	const isTransfer = item.transactionType === "Transferência";
	const isIncomingTransfer = isTransfer && Number(item.amount) > 0;
	const payerLabel = item.pagadorName?.trim() || "Sem pessoa";
	const payerDisplayName = payerLabel.split(/\s+/)[0] ?? payerLabel;
	const paymentMethodLabel =
		item.paymentMethod === "Transferência bancária"
			? "Transf. bancária"
			: item.paymentMethod;

	const type =
		item.categoriaName === "Saldo inicial"
			? "Saldo inicial"
			: item.transactionType;

	return (
		<article
			className={cn(
				"rounded-md border bg-card px-3 py-2.5 shadow-xs",
				item.paymentMethod === "Boleto" &&
					item.dueDate &&
					!item.isSettled &&
					new Date(item.dueDate) < new Date() &&
					"border-destructive/20 bg-destructive/3",
			)}
		>
			<div className="flex items-center gap-2.5">
				<EstablishmentLogo name={item.name} size={34} />
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<h3 className="truncate text-sm font-semibold leading-tight">
								{item.name}
							</h3>
							<div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<RiCalendarEventLine className="size-3.5" aria-hidden />
									{formatDate(item.purchaseDate)}
								</span>
								{dueDateLabel ? (
									<span className="font-medium text-primary">
										{dueDateLabel}
									</span>
								) : null}
								<span className="truncate">{payerDisplayName}</span>
							</div>
						</div>
						<div className="shrink-0 text-right">
							<MoneyValues
								amount={item.amount}
								showPositiveSign={isReceita || isIncomingTransfer}
								className={cn(
									"whitespace-nowrap text-sm font-semibold",
									isReceita ? "text-success" : "text-foreground",
									isTransfer && "text-info",
								)}
							/>
						</div>
					</div>

					<div className="mt-2 flex items-center justify-between gap-2">
						<div className="flex min-w-0 flex-wrap items-center gap-1.5">
							<IconBadge
								label={type}
								compact
								className={getTransactionTypeIconClassName(type)}
							>
								{getTransactionTypeIcon(type)}
							</IconBadge>
							<IconBadge label={paymentMethodLabel} compact>
								{getPaymentMethodIcon(item.paymentMethod)}
							</IconBadge>
							<IconBadge label={item.condition} compact>
								{getConditionIcon(item.condition)}
							</IconBadge>
							{installmentBadge ? (
								<Badge variant="outline" className="px-1.5 text-xs">
									{installmentBadge}
								</Badge>
							) : null}
							{item.isDivided ? (
								<IconBadge label="Dividido entre pessoas" compact>
									<RiGroupLine className="size-3.5" aria-hidden />
								</IconBadge>
							) : null}
							{isLastInstallment ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex size-6 items-center justify-center rounded-full border text-muted-foreground">
											<Image
												src="/icons/party.svg"
												alt=""
												width={14}
												height={14}
												className="size-3.5"
											/>
											<span className="sr-only">Última parcela</span>
										</span>
									</TooltipTrigger>
									<TooltipContent side="top">Última parcela!</TooltipContent>
								</Tooltip>
							) : null}
							{item.isAnticipated ? (
								<IconBadge label="Parcela antecipada" compact>
									<RiTimeLine className="size-3.5" aria-hidden />
								</IconBadge>
							) : null}
							{hasNote ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex size-6 items-center justify-center rounded-full border text-muted-foreground">
											<RiChat1Line className="size-3.5" aria-hidden />
											<span className="sr-only">Ver anotação</span>
										</span>
									</TooltipTrigger>
									<TooltipContent
										side="top"
										align="start"
										className="max-w-xs whitespace-pre-line"
									>
										{item.note}
									</TooltipContent>
								</Tooltip>
							) : null}
							{item.hasAttachments ? (
								<IconBadge label="Possui anexos" compact>
									<RiAttachment2 className="size-3.5" aria-hidden />
								</IconBadge>
							) : null}
						</div>
						{showActions ? (
							<div className="flex shrink-0 items-center gap-1">
								<TransactionSettlementButton
									item={item}
									isLoading={isSettlementLoading(item.id)}
									onToggle={onToggleSettlement}
								/>
								<TransactionActionsMenu
									item={item}
									currentUserId={currentUserId}
									onEdit={onEdit}
									onCopy={onCopy}
									onImport={onImport}
									onConfirmDelete={onConfirmDelete}
									onViewDetails={onViewDetails}
									onRefund={onRefund}
									onAnticipate={onAnticipate}
									onViewAnticipationHistory={onViewAnticipationHistory}
									onConvertToInstallment={onConvertToInstallment}
									onConvertToRecurring={onConvertToRecurring}
								/>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</article>
	);
}

function IconBadge({
	label,
	children,
	compact = false,
	className,
}: {
	label: string;
	children: ReactNode;
	compact?: boolean;
	className?: string;
}) {
	if (!children) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					className={cn(
						"inline-flex items-center rounded-full border text-xs text-muted-foreground",
						compact ? "size-6 justify-center" : "gap-1 px-2 py-0.5",
						className,
					)}
				>
					{children}
					{compact ? <span className="sr-only">{label}</span> : label}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top">{label}</TooltipContent>
		</Tooltip>
	);
}

function getTransactionTypeIcon(type: string) {
	if (type === "Receita" || type === "Saldo inicial") {
		return <RiArrowRightDownLine className="size-3.5" aria-hidden />;
	}

	if (type === "Transferência") {
		return <RiArrowLeftRightLine className="size-3.5" aria-hidden />;
	}

	return <RiArrowRightUpLine className="size-3.5" aria-hidden />;
}

function getTransactionTypeIconClassName(type: string) {
	if (type === "Receita" || type === "Saldo inicial") {
		return "border-success/30 bg-success/5 text-success";
	}

	if (type === "Transferência") {
		return "border-info/30 bg-info/5 text-info";
	}

	return "border-destructive/30 bg-destructive/5 text-destructive";
}
