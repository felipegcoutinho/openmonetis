"use client";
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
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { formatDate } from "@/lib/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/ui";
import { title_font } from "@/public/fonts/font_index";
import {
  RiAddCircleFill,
  RiAddCircleLine,
  RiArrowLeftRightLine,
  RiBankCard2Line,
  RiBankLine,
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
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EstabelecimentoLogo } from "../shared/estabelecimento-logo";
import type {
  ContaCartaoFilterOption,
  LancamentoFilterOption,
  LancamentoItem,
} from "../types";
import { LancamentosExport } from "../lancamentos-export";
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
      accessorKey: "purchaseDate",
      header: "Data",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.purchaseDate)}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Estabelecimento",
      cell: ({ row }) => {
        const {
          name,
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

            {hasNote ? (
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
              isReceita
                ? "text-green-600 dark:text-green-400"
                : "text-foreground",
              isTransfer && "text-blue-700 dark:text-blue-500"
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
      accessorKey: "pagadorName",
      header: "Pagador",
      cell: ({ row }) => {
        const { pagadorId, pagadorName, pagadorAvatar } = row.original;

        if (!pagadorName) {
          return <Badge variant="outline">—</Badge>;
        }

        const label = pagadorName.trim() || "Sem pagador";
        const displayName = label.split(/\s+/)[0] ?? label;
        const avatarSrc = getAvatarSrc(pagadorAvatar);
        const initial = displayName.charAt(0).toUpperCase() || "?";
        const content = (
          <>
            <Avatar className="size-6 border border-border/60 bg-background">
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
            <Badge
              variant="outline"
              className="max-w-[200px] px-2 py-0.5"
              title={label}
            >
              <span className="inline-flex items-center gap-2">{content}</span>
            </Badge>
          );
        }

        return (
          <Badge
            asChild
            variant="outline"
            className="max-w-[200px] px-2 py-0.5"
          >
            <Link
              href={`/pagadores/${pagadorId}`}
              className="inline-flex items-center gap-2"
              title={label}
            >
              {content}
            </Link>
          </Badge>
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
        const label = cartaoName ?? contaName;
        const logoSrc = resolveLogoSrc(cartaoLogo ?? contaLogo);
        const href = cartaoId
          ? `/cartoes/${cartaoId}/fatura`
          : contaId
          ? `/contas/${contaId}/extrato`
          : null;
        const Icon = cartaoId ? RiBankCard2Line : contaId ? RiBankLine : null;
        const isOwnData = userId === currentUserId;

        if (!label) {
          return "—";
        }

        const content = (
          <>
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={`Logo de ${label}`}
                width={32}
                height={32}
                className="rounded-lg"
              />
            ) : null}
            <span className="truncate">{label}</span>
            {Icon ? (
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            ) : null}
          </>
        );

        if (!isOwnData) {
          return <div className="flex items-center gap-2">{content}</div>;
        }

        return (
          <Link
            href={href ?? "#"}
            className={cn(
              "flex items-center gap-2",
              href ? "underline " : "pointer-events-none"
            )}
            aria-disabled={!href}
          >
            {content}
          </Link>
        );
      },
    },
  ];

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
            ].includes(paymentMethod);

            if (!showSettlementButton) {
              return null;
            }

            const canToggleSettlement =
              paymentMethod === "Pix" ||
              paymentMethod === "Boleto" ||
              paymentMethod === "Dinheiro" ||
              paymentMethod === "Cartão de débito";
            const readOnly = row.original.readonly;
            const loading = isSettlementLoading(row.original.id);
            const settled = Boolean(row.original.isSettled);
            const Icon = settled ? RiThumbUpFill : RiThumbUpLine;

            return (
              <Button
                variant={settled ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => handleToggleSettlement(row.original)}
                disabled={loading || readOnly || !canToggleSettlement}
                className={canToggleSettlement ? undefined : "opacity-70"}
              >
                {loading ? (
                  <Spinner className="size-4" />
                ) : (
                  <Icon className={cn("size-4", settled && "text-green-600")} />
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
              {row.original.categoriaName !== "Pagamentos" && row.original.userId === currentUserId && (
                <DropdownMenuItem onSelect={() => handleCopy(row.original)}>
                  <RiFileCopyLine className="size-4" />
                  Copiar
                </DropdownMenuItem>
              )}
              {row.original.categoriaName !== "Pagamentos" && row.original.userId !== currentUserId && (
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
                        <RiCheckLine className="size-4 text-green-500" />
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

type LancamentosTableProps = {
  data: LancamentoItem[];
  currentUserId: string;
  pagadorFilterOptions?: LancamentoFilterOption[];
  categoriaFilterOptions?: LancamentoFilterOption[];
  contaCartaoFilterOptions?: ContaCartaoFilterOption[];
  selectedPeriod?: string;
  onCreate?: () => void;
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
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () =>
      buildColumns({
        currentUserId,
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
      }),
    [
      currentUserId,
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
    ]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
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
    0
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
            <div className="flex gap-2">
              {onCreate ? (
                <Button onClick={onCreate} className="w-full sm:w-auto">
                  <RiAddCircleLine className="size-4" />
                  Novo lançamento
                </Button>
              ) : null}
              {onMassAdd ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onMassAdd}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
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

      {selectedCount > 0 && onBulkDelete && selectedRows.every(row => row.original.userId === currentUserId) ? (
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

      {selectedCount > 0 && onBulkImport && selectedRows.some(row => row.original.userId !== currentUserId) ? (
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
                  <TableHeader className={`${title_font.className}`}>
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
                                  header.getContext()
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
                              cell.getContext()
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
