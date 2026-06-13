"use client";
import {
	RiArrowLeftRightLine,
	RiFileExcel2Line,
	RiFlashlightFill,
} from "@remixicon/react";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import type {
	TransactionsExportContext,
	TransactionsPaginationState,
} from "@/features/transactions/lib/export-types";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
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
import { cn } from "@/shared/utils/ui";
import { TransactionsExport } from "../transactions-export";
import type {
	AccountCardFilterOption,
	TransactionFilterOption,
	TransactionItem,
} from "../types";
import { TransactionsBulkBar } from "./transactions-bulk-bar";
import { getTransactionColumns } from "./transactions-columns";
import { TransactionsFilters } from "./transactions-filters";
import { TransactionsMobileList } from "./transactions-mobile-list";
import { TransactionsPagination } from "./transactions-pagination";

type TransactionsTableProps = {
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
	createSlot?: ReactNode;
	onMassAdd?: () => void;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onBulkDelete?: (items: TransactionItem[]) => void;
	onBulkImport?: (items: TransactionItem[]) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onRefund?: (item: TransactionItem) => void;
	onConvertToInstallment?: (item: TransactionItem) => void;
	onConvertToRecurring?: (item: TransactionItem) => void;
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
	createSlot,
	onMassAdd,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onBulkDelete,
	onBulkImport,
	onViewDetails,
	onRefund,
	onConvertToInstallment,
	onConvertToRecurring,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	isSettlementLoading,
	showActions = true,
	showFilters = true,
}: TransactionsTableProps) {
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

	const columns = useMemo(
		() =>
			getTransactionColumns({
				currentUserId,
				noteAsColumn,
				onEdit,
				onCopy,
				onImport,
				onConfirmDelete,
				onViewDetails,
				onRefund,
				onConvertToInstallment,
				onConvertToRecurring,
				onToggleSettlement,
				onAnticipate,
				onViewAnticipationHistory,
				isSettlementLoading: isSettlementLoading ?? (() => false),
				showActions,
				columnOrder: columnOrderPreference,
			}),
		[
			currentUserId,
			noteAsColumn,
			columnOrderPreference,
			onEdit,
			onCopy,
			onImport,
			onConfirmDelete,
			onViewDetails,
			onRefund,
			onConvertToInstallment,
			onConvertToRecurring,
			onToggleSettlement,
			onAnticipate,
			onViewAnticipationHistory,
			isSettlementLoading,
			showActions,
		],
	);

	const table = useReactTable({
		data,
		columns,
		state: isServerPaginated
			? { sorting, columnVisibility, rowSelection }
			: { sorting, columnVisibility, pagination, rowSelection },
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
		enableRowSelection: (row) =>
			row.original.userId === currentUserId
				? !row.original.readonly
				: Boolean(onBulkImport),
	});

	const rowModel = table.getRowModel();
	const hasRows = rowModel.rows.length > 0;
	const totalRows = isServerPaginated
		? (serverPagination?.totalItems ?? 0)
		: table.getCoreRowModel().rows.length;
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedOwnRows = selectedRows.filter(
		(row) => row.original.userId === currentUserId,
	);
	const selectedImportRows = selectedRows.filter(
		(row) => row.original.userId !== currentUserId,
	);
	const selectedCount = selectedRows.length;
	const selectedTotal = selectedRows.reduce(
		(total, row) => total + (row.original.amount ?? 0),
		0,
	);
	const selectedImportTotal = selectedImportRows.reduce(
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

	const hasOtherUserData = data.some((item) => item.userId !== currentUserId);

	const handleBulkDelete = () => {
		if (onBulkDelete && selectedCount > 0) {
			onBulkDelete(selectedRows.map((row) => row.original));
			setRowSelection({});
		}
	};

	const handleBulkImport = () => {
		if (onBulkImport && selectedImportRows.length > 0) {
			onBulkImport(selectedImportRows.map((row) => row.original));
			setRowSelection({});
		}
	};

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

	const handlePageChange = (nextPage: number) => {
		if (isServerPaginated) {
			navigateToPage(nextPage);
		} else {
			table.setPageIndex(nextPage - 1);
		}
	};

	const handlePageSizeChange = (size: number) => {
		if (isServerPaginated) {
			navigateToPage(1, size);
		} else {
			table.setPageSize(size);
		}
	};

	const showTopControls =
		Boolean(createSlot) || Boolean(onMassAdd) || showFilters;

	return (
		<TooltipProvider>
			{showTopControls ? (
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					{createSlot || onMassAdd ? (
						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
							{createSlot}
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
			selectedOwnRows.length === selectedCount ? (
				<TransactionsBulkBar
					selectedCount={selectedCount}
					selectedTotal={selectedTotal}
					mode="delete"
					onAction={handleBulkDelete}
				/>
			) : null}

			{selectedCount > 0 && onBulkImport && selectedImportRows.length > 0 ? (
				<TransactionsBulkBar
					selectedCount={selectedImportRows.length}
					selectedTotal={selectedImportTotal}
					mode="import"
					onAction={handleBulkImport}
				/>
			) : null}

			<Card className="py-2">
				<CardContent className="px-2 py-4 sm:px-4">
					{hasRows ? (
						<>
							<TransactionsMobileList
								data={rowModel.rows.map((row) => row.original)}
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
								isSettlementLoading={isSettlementLoading ?? (() => false)}
								showActions={showActions}
							/>

							<div className="hidden overflow-x-auto md:block">
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

							<TransactionsPagination
								totalRows={totalRows}
								currentPage={currentPage}
								currentPageSize={currentPageSize}
								totalPages={totalPages}
								canPreviousPage={canPreviousPage}
								canNextPage={canNextPage}
								onPageChange={handlePageChange}
								onPageSizeChange={handlePageSizeChange}
							/>
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
