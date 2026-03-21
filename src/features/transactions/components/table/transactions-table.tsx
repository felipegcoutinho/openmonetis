"use client";
import {
	RiAddFill,
	RiArrowLeftDoubleLine,
	RiArrowLeftRightLine,
	RiArrowLeftSLine,
	RiArrowRightDoubleLine,
	RiArrowRightSLine,
	RiBankCard2Line,
	RiChat1Line,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCheckLine,
	RiDeleteBin5Line,
	RiFileCopyLine,
	RiFileList2Line,
	RiFlashlightFill,
	RiFileExcel2Line,
	RiGroupLine,
	RiHistoryLine,
	RiMoreFill,
	RiPencilLine,
	RiTimeLine,
} from "@remixicon/react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DEFAULT_LANCAMENTOS_COLUMN_ORDER } from "@/features/transactions/column-order";
import type {
	TransactionsExportContext,
	TransactionsPaginationState,
} from "@/features/transactions/export-types";
import { EmptyState } from "@/shared/components/empty-state";
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
import { Card, CardContent } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Spinner } from "@/shared/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { formatDate } from "@/shared/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";
import { TransactionsExport } from "../transactions-export";
import type {
	AccountCardFilterOption,
	TransactionFilterOption,
	TransactionItem,
} from "../types";
import { TransactionsFilters } from "./transactions-filters";

type BuildColumnsArgs = {
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
};

const buildColumns = ({
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
}: BuildColumnsArgs): ColumnDef<TransactionItem>[] => {
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
				} = row.original;

				const installmentBadge =
					currentInstallment && installmentCount
						? `${currentInstallment} de ${installmentCount}`
						: null;

				const isBoleto = paymentMethod === "Boleto" && dueDate;
				const dueDateLabel =
					isBoleto && dueDate ? `Venc. ${formatDate(dueDate)}` : null;
				const hasNote = Boolean(note?.trim().length);
				const isLastInstallment =
					currentInstallment === installmentCount &&
					installmentCount &&
					installmentCount > 1;

				return (
					<span className="flex items-center gap-2">
						<EstablishmentLogo name={name} size={28} />
						<span className="flex flex-col">
							<span className="text-[11px] text-muted-foreground">
								{formatDate(purchaseDate)}
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="line-clamp-2 max-w-[160px] font-semibold truncate">
										{name}
									</span>
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-xs">
									{name}
								</TooltipContent>
							</Tooltip>
						</span>

						{isDivided && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-flex rounded-full p-1">
										<RiGroupLine
											size={14}
											className="text-muted-foreground"
											aria-hidden
										/>
										<span className="sr-only">Dividido entre pagadores</span>
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

						{dueDateLabel ? (
							<Badge variant="outline" className="px-2 text-xs">
								{dueDateLabel}
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
								<TooltipContent side="top">Parcela antecipada</TooltipContent>
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
						<span>{method}</span>
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

						if (!showSettlementButton) {
							return null;
						}

						const canToggleSettlement =
							paymentMethod === "Pix" ||
							paymentMethod === "Boleto" ||
							paymentMethod === "Dinheiro" ||
							paymentMethod === "Cartão de débito" ||
							paymentMethod === "Transferência bancária" ||
							paymentMethod === "Pré-Pago | VR/VA";

						if (!canToggleSettlement)
							return (
								<span className="flex size-7 shrink-0 items-center justify-center">
									<RiBankCard2Line className="size-4 text-muted-foreground/30" />
								</span>
							);

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
};

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

type LancamentosTableProps = {
	data: TransactionItem[];
	currentUserId: string;
	noteAsColumn?: boolean;
	columnOrder?: string[] | null;
	payerFilterOptions?: TransactionFilterOption[];
	categoryFilterOptions?: TransactionFilterOption[];
	accountCardFilterOptions?: AccountCardFilterOption[];
	selectedPeriod?: string;
	pagination?: TransactionsPaginationState;
	exportContext?: TransactionsExportContext;
	onCreate?: (type: "Despesa" | "Receita") => void;
	onMassAdd?: () => void;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onBulkDelete?: (items: TransactionItem[]) => void;
	onBulkImport?: (items: TransactionItem[]) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onToggleSettlement?: (item: TransactionItem) => void;
	onAnticipate?: (item: TransactionItem) => void;
	onViewAnticipationHistory?: (item: TransactionItem) => void;
	isSettlementLoading?: (id: string) => boolean;
	showActions?: boolean;
	showFilters?: boolean;
};

export function TransactionsTable({
	data,
	currentUserId,
	noteAsColumn = false,
	columnOrder: columnOrderPreference = null,
	payerFilterOptions = [],
	categoryFilterOptions = [],
	accountCardFilterOptions = [],
	selectedPeriod,
	pagination: serverPagination,
	exportContext,
	onCreate,
	onMassAdd,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onBulkDelete,
	onBulkImport,
	onViewDetails,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	isSettlementLoading,
	showActions = true,
	showFilters = true,
}: LancamentosTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "purchaseDate", desc: true },
	]);
	const [columnVisibility] = useState<VisibilityState>({
		purchaseDate: false,
	});
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 30,
	});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const isServerPaginated = Boolean(serverPagination);

	const columns = useMemo(() => {
		const built = buildColumns({
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
			isSettlementLoading: isSettlementLoading ?? (() => false),
			showActions,
		});
		const order = columnOrderPreference?.length
			? columnOrderPreference
			: DEFAULT_LANCAMENTOS_COLUMN_ORDER;
		return reorderColumnsByPreference(built, order);
	}, [
		currentUserId,
		noteAsColumn,
		columnOrderPreference,
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
	]);

	const table = useReactTable({
		data,
		columns,
		state: isServerPaginated
			? {
					sorting,
					columnVisibility,
					rowSelection,
				}
			: {
					sorting,
					columnVisibility,
					pagination,
					rowSelection,
				},
		onSortingChange: setSorting,
		onPaginationChange: isServerPaginated ? undefined : setPagination,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: isServerPaginated
			? undefined
			: getPaginationRowModel(),
		manualPagination: isServerPaginated,
		pageCount: serverPagination?.totalPages,
		enableRowSelection: true,
	});

	const rowModel = table.getRowModel();
	const hasRows = rowModel.rows.length > 0;
	const totalRows = isServerPaginated
		? (serverPagination?.totalItems ?? 0)
		: table.getCoreRowModel().rows.length;
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCount = selectedRows.length;
	const selectedTotal = selectedRows.reduce(
		(total, row) => total + (row.original.amount ?? 0),
		0,
	);
	const currentPage = isServerPaginated
		? (serverPagination?.page ?? 1)
		: table.getState().pagination.pageIndex + 1;
	const currentPageSize = isServerPaginated
		? (serverPagination?.pageSize ?? pagination.pageSize)
		: pagination.pageSize;
	const totalPages = isServerPaginated
		? Math.max(serverPagination?.totalPages ?? 1, 1)
		: Math.max(table.getPageCount(), 1);
	const canPreviousPage = currentPage > 1;
	const canNextPage = currentPage < totalPages;

	// Check if there's any data from other users
	const hasOtherUserData = data.some((item) => item.userId !== currentUserId);

	const handleBulkDelete = () => {
		if (onBulkDelete && selectedCount > 0) {
			const selectedItems = selectedRows.map((row) => row.original);
			onBulkDelete(selectedItems);
			setRowSelection({});
		}
	};

	const handleBulkImport = () => {
		if (onBulkImport && selectedCount > 0) {
			const selectedItems = selectedRows.map((row) => row.original);
			onBulkImport(selectedItems);
			setRowSelection({});
		}
	};

	const showTopControls =
		Boolean(onCreate) || Boolean(onMassAdd) || showFilters;

	const navigateToPage = (nextPage: number, nextPageSize = currentPageSize) => {
		const nextParams = new URLSearchParams(searchParams.toString());

		if (nextPage <= 1) {
			nextParams.delete("page");
		} else {
			nextParams.set("page", nextPage.toString());
		}

		if (nextPageSize === 30) {
			nextParams.delete("pageSize");
		} else {
			nextParams.set("pageSize", nextPageSize.toString());
		}

		const target = nextParams.toString()
			? `${pathname}?${nextParams.toString()}`
			: pathname;
		router.replace(target, { scroll: false });
		setRowSelection({});
	};

	return (
		<TooltipProvider>
			{showTopControls ? (
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					{onCreate || onMassAdd ? (
						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
							{onCreate ? (
								<>
									<Button
										onClick={() => onCreate("Receita")}
										className="w-full sm:w-auto"
									>
										<RiAddFill className="size-4" />
										Nova Receita
									</Button>
									<Button
										onClick={() => onCreate("Despesa")}
										className="w-full sm:w-auto"
									>
										<RiAddFill className="size-4" />
										Nova Despesa
									</Button>
								</>
							) : null}
							{onMassAdd ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={onMassAdd}
											variant="outline"
											size="icon"
											className="hidden size-9 sm:inline-flex"
										>
											<RiFlashlightFill className="size-4" />
											<span className="sr-only">
												Adicionar múltiplos lançamentos
											</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Adicionar múltiplos lançamentos</p>
									</TooltipContent>
								</Tooltip>
							) : null}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => router.push("/transactions/import")}
										variant="outline"
										size="icon"
										className="hidden size-9 sm:inline-flex"
									>
										<RiFileExcel2Line className="size-4" />
										<span className="sr-only">Importar extrato</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Importar extrato</p>
								</TooltipContent>
							</Tooltip>
						</div>
					) : (
						<span className={showFilters ? "hidden sm:block" : ""} />
					)}

					{showFilters ? (
						<TransactionsFilters
							payerOptions={payerFilterOptions}
							categoryOptions={categoryFilterOptions}
							accountCardOptions={accountCardFilterOptions}
							className="w-full lg:flex-1 lg:justify-end"
							hideAdvancedFilters={hasOtherUserData}
							exportButton={
								selectedPeriod ? (
									<TransactionsExport
										lancamentos={data}
										period={selectedPeriod}
										exportContext={exportContext}
									/>
								) : null
							}
						/>
					) : null}
				</div>
			) : null}

			{selectedCount > 0 &&
			onBulkDelete &&
			selectedRows.every((row) => row.original.userId === currentUserId) ? (
				<div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
					<div className="flex flex-col text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
						<span>
							{selectedCount}{" "}
							{selectedCount === 1 ? "item selecionado" : "itens selecionados"}
						</span>
						<span className="hidden sm:inline" aria-hidden>
							-
						</span>
						<span>
							Total:{" "}
							<MoneyValues
								amount={selectedTotal}
								className="inline font-medium text-foreground"
							/>
						</span>
					</div>
					<Button
						onClick={handleBulkDelete}
						variant="destructive"
						size="sm"
						className="ml-auto"
					>
						<RiDeleteBin5Line className="size-4" />
						Remover selecionados
					</Button>
				</div>
			) : null}

			{selectedCount > 0 &&
			onBulkImport &&
			selectedRows.some((row) => row.original.userId !== currentUserId) ? (
				<div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
					<div className="flex flex-col text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
						<span>
							{selectedCount}{" "}
							{selectedCount === 1 ? "item selecionado" : "itens selecionados"}
						</span>
						<span className="hidden sm:inline" aria-hidden>
							-
						</span>
						<span>
							Total:{" "}
							<MoneyValues
								amount={selectedTotal}
								className="inline font-medium text-foreground"
							/>
						</span>
					</div>
					<Button
						onClick={handleBulkImport}
						variant="default"
						size="sm"
						className="ml-auto"
					>
						<RiFileCopyLine className="size-4" />
						Importar selecionados
					</Button>
				</div>
			) : null}

			<Card className="py-2">
				<CardContent className="px-2 py-4 sm:px-4">
					{hasRows ? (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										{table.getHeaderGroups().map((headerGroup) => (
											<TableRow key={headerGroup.id}>
												{headerGroup.headers.map((header) => (
													<TableHead
														key={header.id}
														className="whitespace-nowrap"
													>
														{header.isPlaceholder
															? null
															: flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
													</TableHead>
												))}
											</TableRow>
										))}
									</TableHeader>
									<TableBody>
										{rowModel.rows.map((row) => (
											<TableRow
												key={row.id}
												className={cn(
													row.original.paymentMethod === "Boleto" &&
														row.original.dueDate &&
														!row.original.isSettled &&
														new Date(row.original.dueDate) < new Date()
														? "bg-destructive/3 hover:bg-destructive/5"
														: undefined,
												)}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										{totalRows} lançamentos
									</span>
									<Select
										value={currentPageSize.toString()}
										onValueChange={(value) => {
											const nextPageSize = Number(value);
											if (isServerPaginated) {
												navigateToPage(1, nextPageSize);
												return;
											}

											table.setPageSize(nextPageSize);
										}}
									>
										<SelectTrigger className="w-max">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="5">5 linhas</SelectItem>
											<SelectItem value="10">10 linhas</SelectItem>
											<SelectItem value="20">20 linhas</SelectItem>
											<SelectItem value="30">30 linhas</SelectItem>
											<SelectItem value="40">40 linhas</SelectItem>
											<SelectItem value="50">50 linhas</SelectItem>
											<SelectItem value="100">100 linhas</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										Página {currentPage} de {totalPages}
									</span>
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												isServerPaginated
													? navigateToPage(1)
													: table.setPageIndex(0)
											}
											disabled={!canPreviousPage}
											aria-label="Primeira página"
										>
											<RiArrowLeftDoubleLine className="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												isServerPaginated
													? navigateToPage(currentPage - 1)
													: table.previousPage()
											}
											disabled={!canPreviousPage}
											aria-label="Página anterior"
										>
											<RiArrowLeftSLine className="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												isServerPaginated
													? navigateToPage(currentPage + 1)
													: table.nextPage()
											}
											disabled={!canNextPage}
											aria-label="Próxima página"
										>
											<RiArrowRightSLine className="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												isServerPaginated
													? navigateToPage(totalPages)
													: table.setPageIndex(table.getPageCount() - 1)
											}
											disabled={!canNextPage}
											aria-label="Última página"
										>
											<RiArrowRightDoubleLine className="size-4" />
										</Button>
									</div>
								</div>
							</div>
						</>
					) : (
						<div className="flex w-full items-center justify-center py-12">
							<EmptyState
								media={<RiArrowLeftRightLine className="size-6 text-primary" />}
								title="Nenhum lançamento encontrado"
								description="Ajuste os filtros ou cadastre um novo lançamento para visualizar aqui."
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}
