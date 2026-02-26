"use client";
import {
	RiAddCircleFill,
	RiAddCircleLine,
	RiArrowLeftRightLine,
	RiArrowRightSLine,
	RiChat1Line,
	RiCheckLine,
	RiDeleteBin5Line,
	RiEyeLine,
	RiFileCopyLine,
	RiGroupLine,
	RiHistoryLine,
	RiMoreFill,
	RiPencilLine,
	RiThumbUpFill,
	RiThumbUpLine,
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
import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/categorias/category-icon";
import { EmptyState } from "@/components/empty-state";
import MoneyValues from "@/components/money-values";
import { TypeBadge } from "@/components/type-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_LANCAMENTOS_COLUMN_ORDER } from "@/lib/lancamentos/column-order";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { formatDate } from "@/lib/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/ui";
import { LancamentosExport } from "../lancamentos-export";
import { EstabelecimentoLogo } from "../shared/estabelecimento-logo";
import type {
	ContaCartaoFilterOption,
	LancamentoFilterOption,
	LancamentoItem,
} from "../types";
import { LancamentosFilters } from "./lancamentos-filters";

const resolveLogoSrc = (logo: string | null) => {
	if (!logo) {
		return null;
	}

	const fileName = logo.split("/").filter(Boolean).pop() ?? logo;
	return `/logos/${fileName}`;
};

type BuildColumnsArgs = {
	currentUserId: string;
	noteAsColumn: boolean;
	onEdit?: (item: LancamentoItem) => void;
	onCopy?: (item: LancamentoItem) => void;
	onImport?: (item: LancamentoItem) => void;
	onConfirmDelete?: (item: LancamentoItem) => void;
	onViewDetails?: (item: LancamentoItem) => void;
	onToggleSettlement?: (item: LancamentoItem) => void;
	onAnticipate?: (item: LancamentoItem) => void;
	onViewAnticipationHistory?: (item: LancamentoItem) => void;
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
}: BuildColumnsArgs): ColumnDef<LancamentoItem>[] => {
	const noop = () => undefined;
	const handleEdit = onEdit ?? noop;
	const handleCopy = onCopy ?? noop;
	const handleImport = onImport ?? noop;
	const handleConfirmDelete = onConfirmDelete ?? noop;
	const handleViewDetails = onViewDetails ?? noop;
	const handleToggleSettlement = onToggleSettlement ?? noop;
	const handleAnticipate = onAnticipate ?? noop;
	const handleViewAnticipationHistory = onViewAnticipationHistory ?? noop;

	const columns: ColumnDef<LancamentoItem>[] = [
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
						<EstabelecimentoLogo name={name} size={28} />
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
											src="/icones/party.svg"
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
									<span className="inline-flex rounded-full p-1 hover:bg-muted/60">
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
									className="max-w-xs whitespace-pre-line text-sm"
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
					<TypeBadge
						type={
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
						<CategoryIcon name={categoriaIcon} className="size-4" />
						<span>{categoriaName}</span>
					</span>
				);
			},
		},
		{
			accessorKey: "pagadorName",
			header: "Pagador",
			cell: ({ row }) => {
				const { pagadorId, pagadorName, pagadorAvatar } = row.original;

				const label = pagadorName.trim() || "Sem pagador";
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

				if (!pagadorId) {
					return (
						<span className="inline-flex items-center gap-2">{content}</span>
					);
				}

				return (
					<Link
						href={`/pagadores/${pagadorId}`}
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
					cartaoId,
					contaId,
					userId,
				} = row.original;
				const isCartao = Boolean(cartaoName);
				const label = cartaoName ?? contaName;
				const logoSrc = resolveLogoSrc(cartaoLogo ?? contaLogo);
				const href = cartaoId
					? `/cartoes/${cartaoId}/fatura`
					: contaId
						? `/contas/${contaId}/extrato`
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
		const contaCartaoIndex = columns.findIndex((c) => c.id === "contaCartao");
		const noteColumn: ColumnDef<LancamentoItem> = {
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
		columns.splice(contaCartaoIndex, 0, noteColumn);
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
						const readOnly = row.original.readonly;
						const loading = isSettlementLoading(row.original.id);
						const settled = Boolean(row.original.isSettled);
						const Icon = settled ? RiThumbUpFill : RiThumbUpLine;

						return (
							<Button
								variant={"outline"}
								size="icon-sm"
								onClick={() => handleToggleSettlement(row.original)}
								disabled={loading || readOnly || !canToggleSettlement}
								className={cn(
									"border-none",
									!canToggleSettlement && "opacity-70 ",
									settled && "border-none",
								)}
							>
								{loading ? (
									<Spinner className="size-4" />
								) : (
									<Icon className={cn("size-4", settled && "text-success")} />
								)}
								<span className="sr-only">
									{settled ? "Desfazer pagamento" : "Marcar como pago"}
								</span>
							</Button>
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
								<RiEyeLine className="size-4" />
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

function getColumnId(col: ColumnDef<LancamentoItem>): string {
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
		const id = getColumnId(col as ColumnDef<LancamentoItem>);
		if (FIXED_START_IDS.includes(id)) fixedStart.push(col);
		else if (FIXED_END_IDS.includes(id)) fixedEnd.push(col);
		else reorderable.push(col);
	}

	const sorted = [...reorderable].sort((a, b) => {
		const idA = getColumnId(a as ColumnDef<LancamentoItem>);
		const idB = getColumnId(b as ColumnDef<LancamentoItem>);
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
	data: LancamentoItem[];
	currentUserId: string;
	noteAsColumn?: boolean;
	columnOrder?: string[] | null;
	pagadorFilterOptions?: LancamentoFilterOption[];
	categoriaFilterOptions?: LancamentoFilterOption[];
	contaCartaoFilterOptions?: ContaCartaoFilterOption[];
	selectedPeriod?: string;
	onCreate?: (type: "Despesa" | "Receita") => void;
	onMassAdd?: () => void;
	onEdit?: (item: LancamentoItem) => void;
	onCopy?: (item: LancamentoItem) => void;
	onImport?: (item: LancamentoItem) => void;
	onConfirmDelete?: (item: LancamentoItem) => void;
	onBulkDelete?: (items: LancamentoItem[]) => void;
	onBulkImport?: (items: LancamentoItem[]) => void;
	onViewDetails?: (item: LancamentoItem) => void;
	onToggleSettlement?: (item: LancamentoItem) => void;
	onAnticipate?: (item: LancamentoItem) => void;
	onViewAnticipationHistory?: (item: LancamentoItem) => void;
	isSettlementLoading?: (id: string) => boolean;
	showActions?: boolean;
	showFilters?: boolean;
};

export function LancamentosTable({
	data,
	currentUserId,
	noteAsColumn = false,
	columnOrder: columnOrderPreference = null,
	pagadorFilterOptions = [],
	categoriaFilterOptions = [],
	contaCartaoFilterOptions = [],
	selectedPeriod,
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
		state: {
			sorting,
			columnVisibility,
			pagination,
			rowSelection,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		enableRowSelection: true,
	});

	const rowModel = table.getRowModel();
	const hasRows = rowModel.rows.length > 0;
	const totalRows = table.getCoreRowModel().rows.length;
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCount = selectedRows.length;
	const selectedTotal = selectedRows.reduce(
		(total, row) => total + (row.original.amount ?? 0),
		0,
	);

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

	return (
		<TooltipProvider>
			{showTopControls ? (
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					{onCreate || onMassAdd ? (
						<div className="relative -mx-6 px-6 md:mx-0 md:px-0">
							<div className="overflow-x-auto overflow-y-hidden scroll-smooth md:overflow-visible [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								<div className="flex w-max shrink-0 gap-2 py-1 md:w-full md:py-0">
									{onCreate ? (
										<>
											<Button
												onClick={() => onCreate("Receita")}
												variant="outline"
												className="h-8 shrink-0 px-3 text-xs sm:w-auto md:h-9 md:px-4 md:text-sm"
											>
												<RiAddCircleLine className="size-4 text-success" />
												Nova Receita
											</Button>
											<Button
												onClick={() => onCreate("Despesa")}
												variant="outline"
												className="h-8 shrink-0 px-3 text-xs sm:w-auto md:h-9 md:px-4 md:text-sm"
											>
												<RiAddCircleLine className="size-4 text-destructive" />
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
													className="size-8 shrink-0 md:size-9"
												>
													<RiAddCircleFill className="size-4" />
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
								</div>
							</div>
							<div
								className="pointer-events-none absolute right-0 top-0 hidden h-9 w-10 items-center justify-end bg-gradient-to-l from-background to-transparent py-1 md:hidden"
								aria-hidden
							>
								<RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
							</div>
						</div>
					) : (
						<span className={showFilters ? "hidden sm:block" : ""} />
					)}

					{showFilters ? (
						<LancamentosFilters
							pagadorOptions={pagadorFilterOptions}
							categoriaOptions={categoriaFilterOptions}
							contaCartaoOptions={contaCartaoFilterOptions}
							className="w-full lg:flex-1 lg:justify-end"
							hideAdvancedFilters={hasOtherUserData}
							exportButton={
								selectedPeriod ? (
									<LancamentosExport
										lancamentos={data}
										period={selectedPeriod}
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
											<TableRow key={row.id}>
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
										Exibindo {rowModel.rows.length} de {totalRows} lançamentos
									</span>
									<Select
										value={pagination.pageSize.toString()}
										onValueChange={(value) => {
											table.setPageSize(Number(value));
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
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.previousPage()}
										disabled={!table.getCanPreviousPage()}
									>
										Anterior
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.nextPage()}
										disabled={!table.getCanNextPage()}
									>
										Próximo
									</Button>
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
