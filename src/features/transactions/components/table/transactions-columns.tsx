import {
	RiAttachment2,
	RiBankCard2Line,
	RiChat1Line,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCheckLine,
	RiDeleteBin5Line,
	RiFileCopyLine,
	RiFileList2Line,
	RiGroupLine,
	RiHistoryLine,
	RiMoreFill,
	RiPencilLine,
	RiTimeLine,
} from "@remixicon/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LANCAMENTOS_COLUMN_ORDER } from "@/features/transactions/column-order";
import {
	CategoryIconBadge,
	EstablishmentLogo,
} from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Spinner } from "@/shared/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { formatDate } from "@/shared/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";
import type { TransactionItem } from "../types";

export type BuildColumnsArgs = {
	currentUserId: string;
	noteAsColumn: boolean;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onToggleSettlement?: (item: TransactionItem) => void;
	onAnticipate?: (item: TransactionItem) => void;
	onViewAnticipationHistory?: (item: TransactionItem) => void;
	isSettlementLoading: (id: string) => boolean;
	showActions: boolean;
	columnOrder?: string[] | null;
};

function getPaymentMethodTableLabel(method: string) {
	if (method === "Transferência bancária") return "Transf. bancária";
	return method;
}

const FIXED_START_IDS = ["select", "purchaseDate"];
const FIXED_END_IDS = ["actions"];

function getColumnId(col: ColumnDef<TransactionItem>): string {
	const c = col as { id?: string; accessorKey?: string };
	return c.id ?? c.accessorKey ?? "";
}

function reorderColumnsByPreference<T>(
	columns: ColumnDef<T>[],
	orderPreference: string[] | null | undefined,
): ColumnDef<T>[] {
	if (!orderPreference || orderPreference.length === 0) return columns;

	const order = orderPreference;
	const fixedStart: ColumnDef<T>[] = [];
	const reorderable: ColumnDef<T>[] = [];
	const fixedEnd: ColumnDef<T>[] = [];

	for (const col of columns) {
		const id = getColumnId(col as ColumnDef<TransactionItem>);
		if (FIXED_START_IDS.includes(id)) fixedStart.push(col);
		else if (FIXED_END_IDS.includes(id)) fixedEnd.push(col);
		else reorderable.push(col);
	}

	const sorted = [...reorderable].sort((a, b) => {
		const idA = getColumnId(a as ColumnDef<TransactionItem>);
		const idB = getColumnId(b as ColumnDef<TransactionItem>);
		const indexA = order.indexOf(idA);
		const indexB = order.indexOf(idB);
		if (indexA === -1 && indexB === -1) return 0;
		if (indexA === -1) return 1;
		if (indexB === -1) return -1;
		return indexA - indexB;
	});

	return [...fixedStart, ...sorted, ...fixedEnd];
}

function buildColumns({
	currentUserId,
	noteAsColumn,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onViewDetails,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	isSettlementLoading,
	showActions,
}: BuildColumnsArgs): ColumnDef<TransactionItem>[] {
	const noop = () => undefined;
	const handleEdit = onEdit ?? noop;
	const handleCopy = onCopy ?? noop;
	const handleImport = onImport ?? noop;
	const handleConfirmDelete = onConfirmDelete ?? noop;
	const handleViewDetails = onViewDetails ?? noop;
	const handleToggleSettlement = onToggleSettlement ?? noop;
	const handleAnticipate = onAnticipate ?? noop;
	const handleViewAnticipationHistory = onViewAnticipationHistory ?? noop;

	const columns: ColumnDef<TransactionItem>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Selecionar todos"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Selecionar linha"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "purchaseDate",
			accessorKey: "purchaseDate",
			header: () => null,
			cell: () => null,
		},
		{
			accessorKey: "name",
			header: "Estabelecimento",
			cell: ({ row }) => {
				const {
					name,
					purchaseDate,
					installmentCount,
					currentInstallment,
					paymentMethod,
					dueDate,
					note,
					isDivided,
					isAnticipated,
					hasAttachments,
				} = row.original;

				const installmentBadge =
					currentInstallment && installmentCount
						? `${currentInstallment} de ${installmentCount}`
						: null;

				const isBoleto = paymentMethod === "Boleto" && dueDate;
				const dueDateLabel =
					isBoleto && dueDate ? `venc. ${formatDate(dueDate)}` : null;
				const hasNote = Boolean(note?.trim().length);
				const isLastInstallment =
					currentInstallment === installmentCount &&
					installmentCount &&
					installmentCount > 1;

				return (
					<span className="flex items-center gap-2">
						<EstablishmentLogo name={name} size={32} />
						<span className="flex flex-col py-0.5">
							<span className="text-xs text-muted-foreground flex items-center gap-2">
								{formatDate(purchaseDate)}
								{dueDateLabel ? (
									<span className="text-primary">{dueDateLabel}</span>
								) : null}
							</span>
							<span className="flex items-center gap-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="line-clamp-2 max-w-[180px] font-semibold truncate">
											{name}
										</span>
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-xs">
										{name}
									</TooltipContent>
								</Tooltip>

								{isDivided && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-1">
												<RiGroupLine
													size={14}
													className="text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">
													Dividido entre pagadores
												</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">
											Dividido entre pagadores
										</TooltipContent>
									</Tooltip>
								)}

								{isLastInstallment ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex">
												<Image
													src="/icons/party.svg"
													alt="Última parcela"
													width={16}
													height={16}
													className="h-4 w-4"
												/>
												<span className="sr-only">Última parcela</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">Última parcela!</TooltipContent>
									</Tooltip>
								) : null}

								{installmentBadge ? (
									<Badge variant="outline" className="px-2 text-xs">
										{installmentBadge}
									</Badge>
								) : null}

								{isAnticipated && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-1">
												<RiTimeLine
													size={14}
													className="text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Parcela antecipada</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">
											Parcela antecipada
										</TooltipContent>
									</Tooltip>
								)}

								{!noteAsColumn && hasNote ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-1 hover:bg-accent transition-colors duration-300">
												<RiChat1Line
													className="h-4 w-4 text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Ver anotação</span>
											</span>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											align="start"
											className="max-w-xs whitespace-pre-line"
										>
											{note}
										</TooltipContent>
									</Tooltip>
								) : null}

								{hasAttachments ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-1">
												<RiAttachment2
													className="h-4 w-4 text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Possui anexos</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">Possui anexos</TooltipContent>
									</Tooltip>
								) : null}
							</span>
						</span>
					</span>
				);
			},
		},
		{
			accessorKey: "transactionType",
			header: "Transação",
			cell: ({ row }) => {
				const type =
					row.original.categoriaName === "Saldo inicial"
						? "Saldo inicial"
						: row.original.transactionType;
				return (
					<TransactionTypeBadge
						kind={
							type as "Despesa" | "Receita" | "Transferência" | "Saldo inicial"
						}
					/>
				);
			},
		},
		{
			accessorKey: "amount",
			header: "Valor",
			cell: ({ row }) => {
				const isReceita = row.original.transactionType === "Receita";
				const isTransfer = row.original.transactionType === "Transferência";
				return (
					<MoneyValues
						amount={row.original.amount}
						showPositiveSign={isReceita}
						className={cn(
							"whitespace-nowrap",
							isReceita ? "text-success" : "text-foreground",
							isTransfer && "text-info",
						)}
					/>
				);
			},
		},
		{
			accessorKey: "condition",
			header: "Condição",
			cell: ({ row }) => {
				const condition = row.original.condition;
				const icon = getConditionIcon(condition);
				return (
					<span className="flex items-center gap-2">
						{icon}
						<span>{condition}</span>
					</span>
				);
			},
		},
		{
			accessorKey: "paymentMethod",
			header: "Forma de Pagamento",
			cell: ({ row }) => {
				const method = row.original.paymentMethod;
				const icon = getPaymentMethodIcon(method);
				return (
					<span className="flex items-center gap-2">
						{icon}
						<span>{getPaymentMethodTableLabel(method)}</span>
					</span>
				);
			},
		},
		{
			accessorKey: "categoriaName",
			header: "Categoria",
			cell: ({ row }) => {
				const { categoriaName, categoriaIcon } = row.original;
				if (!categoriaName) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<span className="flex items-center gap-2">
						<CategoryIconBadge
							icon={categoriaIcon}
							name={categoriaName}
							size="sm"
						/>
						<span>{categoriaName}</span>
					</span>
				);
			},
		},
		{
			accessorKey: "pagadorName",
			header: "Pagador",
			cell: ({ row }) => {
				const { payerId, pagadorName, pagadorAvatar } = row.original;
				const label = pagadorName?.trim() || "Sem pagador";
				const displayName = label.split(/\s+/)[0] ?? label;
				const avatarSrc = getAvatarSrc(pagadorAvatar);
				const initial = displayName.charAt(0).toUpperCase() || "?";
				const content = (
					<>
						<Avatar className="size-7">
							<AvatarImage src={avatarSrc} alt={`Avatar de ${label}`} />
							<AvatarFallback className="text-[10px] font-medium uppercase">
								{initial}
							</AvatarFallback>
						</Avatar>
						<span className="truncate">{displayName}</span>
					</>
				);
				if (!payerId) {
					return (
						<span className="inline-flex items-center gap-2">{content}</span>
					);
				}
				return (
					<Link
						href={`/payers/${payerId}`}
						className="inline-flex items-center gap-2 hover:underline"
						title={label}
					>
						{content}
					</Link>
				);
			},
		},
		{
			id: "contaCartao",
			header: "Conta/Cartão",
			cell: ({ row }) => {
				const {
					cartaoName,
					contaName,
					cartaoLogo,
					contaLogo,
					cardId,
					accountId,
					userId,
				} = row.original;
				const isCartao = Boolean(cartaoName);
				const label = cartaoName ?? contaName;
				const logoSrc = resolveLogoSrc(cartaoLogo ?? contaLogo);
				const href = cardId
					? `/cards/${cardId}/invoice`
					: accountId
						? `/accounts/${accountId}/statement`
						: null;
				const isOwnData = userId === currentUserId;

				const content = (
					<span className="inline-flex items-center gap-2">
						{logoSrc && (
							<Image
								src={logoSrc}
								alt={`Logo de ${label}`}
								width={30}
								height={30}
								className="rounded-full"
							/>
						)}
						<span className="truncate">{label}</span>
					</span>
				);

				if (!isOwnData || !href) {
					return (
						<Tooltip>
							<TooltipTrigger asChild>{content}</TooltipTrigger>
							<TooltipContent side="top">
								{isCartao ? "Cartão" : "Conta"}: {label}
							</TooltipContent>
						</Tooltip>
					);
				}

				return (
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								href={href}
								className="inline-flex items-center gap-2 hover:underline"
							>
								{logoSrc && (
									<Image
										src={logoSrc}
										alt={`Logo de ${label}`}
										width={30}
										height={30}
										className="rounded-full"
									/>
								)}
								<span className="truncate">{label}</span>
							</Link>
						</TooltipTrigger>
						<TooltipContent side="top">
							{isCartao ? "Cartão" : "Conta"}: {label}
						</TooltipContent>
					</Tooltip>
				);
			},
		},
	];

	if (noteAsColumn) {
		const accountCardIndex = columns.findIndex((c) => c.id === "contaCartao");
		const noteColumn: ColumnDef<TransactionItem> = {
			accessorKey: "note",
			header: "Anotação",
			cell: ({ row }) => {
				const note = row.original.note;
				if (!note?.trim())
					return <span className="text-muted-foreground">—</span>;
				return (
					<span
						className="max-w-[200px] truncate whitespace-pre-line text-sm"
						title={note}
					>
						{note}
					</span>
				);
			},
		};
		columns.splice(accountCardIndex, 0, noteColumn);
	}

	if (showActions) {
		columns.push({
			id: "actions",
			header: "Ações",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					{(() => {
						const paymentMethod = row.original.paymentMethod;
						const showSettlementButton = [
							"Pix",
							"Boleto",
							"Cartão de crédito",
							"Dinheiro",
							"Cartão de débito",
							"Transferência bancária",
							"Pré-Pago | VR/VA",
						].includes(paymentMethod);

						if (!showSettlementButton) return null;

						const canToggleSettlement =
							paymentMethod === "Pix" ||
							paymentMethod === "Boleto" ||
							paymentMethod === "Dinheiro" ||
							paymentMethod === "Cartão de débito" ||
							paymentMethod === "Transferência bancária" ||
							paymentMethod === "Pré-Pago | VR/VA";

						if (!canToggleSettlement) {
							const invoicePaid = Boolean(row.original.isSettled);
							return (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex">
											<Button
												variant="ghost"
												size="icon-sm"
												disabled
												className={cn(
													"transition-colors",
													invoicePaid
														? "bg-success/10 text-success"
														: "text-muted-foreground/30",
												)}
											>
												{invoicePaid ? (
													<RiCheckboxCircleFill className="size-4" />
												) : (
													<RiBankCard2Line className="size-4" />
												)}
												<span className="sr-only">
													{invoicePaid
														? "Fatura paga"
														: "Lançamento de cartão de crédito"}
												</span>
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-48 text-center">
										{invoicePaid
											? "Fatura paga"
											: "Lançamentos de cartão de crédito são liquidados ao pagar a fatura"}
									</TooltipContent>
								</Tooltip>
							);
						}

						const readOnly = row.original.readonly;
						const loading = isSettlementLoading(row.original.id);
						const settled = Boolean(row.original.isSettled);

						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => handleToggleSettlement(row.original)}
										disabled={loading || readOnly}
										className={cn(
											"transition-colors",
											settled
												? "bg-success/10 text-success hover:bg-success/20 hover:text-success"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										{loading ? (
											<Spinner className="size-4" />
										) : settled ? (
											<RiCheckboxCircleFill className="size-4" />
										) : (
											<RiCheckboxBlankCircleLine className="size-4" />
										)}
										<span className="sr-only">
											{settled ? "Desfazer pagamento" : "Marcar como pago"}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									{settled ? "Desfazer pagamento" : "Marcar como pago"}
								</TooltipContent>
							</Tooltip>
						);
					})()}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-sm">
								<RiMoreFill className="size-4" />
								<span className="sr-only">Abrir ações do lançamento</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<DropdownMenuItem
								onSelect={() => handleViewDetails(row.original)}
							>
								<RiFileList2Line className="size-4" />
								Detalhes
							</DropdownMenuItem>
							{row.original.userId === currentUserId && (
								<DropdownMenuItem
									onSelect={() => handleEdit(row.original)}
									disabled={row.original.readonly}
								>
									<RiPencilLine className="size-4" />
									Editar
								</DropdownMenuItem>
							)}
							{row.original.categoriaName !== "Pagamentos" &&
								row.original.userId === currentUserId && (
									<DropdownMenuItem onSelect={() => handleCopy(row.original)}>
										<RiFileCopyLine className="size-4" />
										Copiar
									</DropdownMenuItem>
								)}
							{row.original.categoriaName !== "Pagamentos" &&
								row.original.userId !== currentUserId && (
									<DropdownMenuItem onSelect={() => handleImport(row.original)}>
										<RiFileCopyLine className="size-4" />
										Importar para Minha Conta
									</DropdownMenuItem>
								)}
							{row.original.userId === currentUserId && (
								<DropdownMenuItem
									variant="destructive"
									onSelect={() => handleConfirmDelete(row.original)}
									disabled={row.original.readonly}
								>
									<RiDeleteBin5Line className="size-4" />
									Remover
								</DropdownMenuItem>
							)}

							{/* Opções de Antecipação */}
							{row.original.userId === currentUserId &&
								row.original.condition === "Parcelado" &&
								row.original.seriesId && (
									<>
										<DropdownMenuSeparator />

										{!row.original.isAnticipated && onAnticipate && (
											<DropdownMenuItem
												onSelect={() => handleAnticipate(row.original)}
											>
												<RiTimeLine className="size-4" />
												Antecipar Parcelas
											</DropdownMenuItem>
										)}

										{onViewAnticipationHistory && (
											<DropdownMenuItem
												onSelect={() =>
													handleViewAnticipationHistory(row.original)
												}
											>
												<RiHistoryLine className="size-4" />
												Histórico de Antecipações
											</DropdownMenuItem>
										)}

										{row.original.isAnticipated && (
											<DropdownMenuItem disabled>
												<RiCheckLine className="size-4 text-success" />
												Parcela Antecipada
											</DropdownMenuItem>
										)}
									</>
								)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		});
	}

	return columns;
}

export function getTransactionColumns(
	args: BuildColumnsArgs,
): ColumnDef<TransactionItem>[] {
	const built = buildColumns(args);
	const order = args.columnOrder?.length
		? args.columnOrder
		: DEFAULT_LANCAMENTOS_COLUMN_ORDER;
	return reorderColumnsByPreference(built, order);
}
