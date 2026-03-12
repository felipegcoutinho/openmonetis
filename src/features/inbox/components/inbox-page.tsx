"use client";

import { RiAtLine, RiDeleteBinLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	bulkDeleteInboxItemsAction,
	deleteInboxItemAction,
	discardInboxItemAction,
	markInboxAsProcessedAction,
	restoreDiscardedInboxItemAction,
} from "@/features/inbox/actions";
import { LancamentoDialog } from "@/features/transactions/components/dialogs/transaction-dialog/transaction-dialog";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { InboxCard } from "./inbox-card";
import { InboxDetailsDialog } from "./inbox-details-dialog";
import type { InboxItem, SelectOption } from "./types";

interface InboxPageProps {
	pendingItems: InboxItem[];
	processedItems: InboxItem[];
	discardedItems: InboxItem[];
	pagadorOptions: SelectOption[];
	splitPagadorOptions: SelectOption[];
	defaultPagadorId: string | null;
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	categoriaOptions: SelectOption[];
	estabelecimentos: string[];
	appLogoMap: Record<string, string>;
}

export function InboxPage({
	pendingItems,
	processedItems,
	discardedItems,
	pagadorOptions,
	splitPagadorOptions,
	defaultPagadorId,
	contaOptions,
	cartaoOptions,
	categoriaOptions,
	estabelecimentos,
	appLogoMap,
}: InboxPageProps) {
	const [processOpen, setProcessOpen] = useState(false);
	const [itemToProcess, setItemToProcess] = useState<InboxItem | null>(null);

	const [detailsOpen, setDetailsOpen] = useState(false);
	const [itemDetails, setItemDetails] = useState<InboxItem | null>(null);

	const [discardOpen, setDiscardOpen] = useState(false);
	const [itemToDiscard, setItemToDiscard] = useState<InboxItem | null>(null);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<InboxItem | null>(null);

	const [restoreOpen, setRestoreOpen] = useState(false);
	const [itemToRestore, setItemToRestore] = useState<InboxItem | null>(null);

	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [bulkDeleteStatus, setBulkDeleteStatus] = useState<
		"processed" | "discarded"
	>("processed");

	const sortedPending = useMemo(
		() =>
			[...pendingItems].sort(
				(a, b) =>
					new Date(b.notificationTimestamp).getTime() -
					new Date(a.notificationTimestamp).getTime(),
			),
		[pendingItems],
	);
	const sortedProcessed = useMemo(
		() =>
			[...processedItems].sort(
				(a, b) =>
					new Date(b.notificationTimestamp).getTime() -
					new Date(a.notificationTimestamp).getTime(),
			),
		[processedItems],
	);
	const sortedDiscarded = useMemo(
		() =>
			[...discardedItems].sort(
				(a, b) =>
					new Date(b.notificationTimestamp).getTime() -
					new Date(a.notificationTimestamp).getTime(),
			),
		[discardedItems],
	);

	const handleProcessOpenChange = (open: boolean) => {
		setProcessOpen(open);
		if (!open) {
			setItemToProcess(null);
		}
	};

	const handleDetailsOpenChange = (open: boolean) => {
		setDetailsOpen(open);
		if (!open) {
			setItemDetails(null);
		}
	};

	const handleDiscardOpenChange = (open: boolean) => {
		setDiscardOpen(open);
		if (!open) {
			setItemToDiscard(null);
		}
	};

	const handleProcessRequest = (item: InboxItem) => {
		setItemToProcess(item);
		setProcessOpen(true);
	};

	const handleDetailsRequest = (item: InboxItem) => {
		setItemDetails(item);
		setDetailsOpen(true);
	};

	const handleDiscardRequest = (item: InboxItem) => {
		setItemToDiscard(item);
		setDiscardOpen(true);
	};

	const handleDiscardConfirm = async () => {
		if (!itemToDiscard) return;

		const result = await discardInboxItemAction({
			inboxItemId: itemToDiscard.id,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleDeleteOpenChange = (open: boolean) => {
		setDeleteOpen(open);
		if (!open) {
			setItemToDelete(null);
		}
	};

	const handleDeleteRequest = (item: InboxItem) => {
		setItemToDelete(item);
		setDeleteOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!itemToDelete) return;

		const result = await deleteInboxItemAction({
			inboxItemId: itemToDelete.id,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleRestoreOpenChange = (open: boolean) => {
		setRestoreOpen(open);
		if (!open) {
			setItemToRestore(null);
		}
	};

	const handleRestoreRequest = (item: InboxItem) => {
		setItemToRestore(item);
		setRestoreOpen(true);
	};

	const handleRestoreToPendingConfirm = async () => {
		if (!itemToRestore) return;

		const result = await restoreDiscardedInboxItemAction({
			inboxItemId: itemToRestore.id,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleBulkDeleteOpenChange = (open: boolean) => {
		setBulkDeleteOpen(open);
	};

	const handleBulkDeleteRequest = (status: "processed" | "discarded") => {
		setBulkDeleteStatus(status);
		setBulkDeleteOpen(true);
	};

	const handleBulkDeleteConfirm = async () => {
		const result = await bulkDeleteInboxItemsAction({
			status: bulkDeleteStatus,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleLancamentoSuccess = async () => {
		if (!itemToProcess) return;

		const result = await markInboxAsProcessedAction({
			inboxItemId: itemToProcess.id,
		});

		if (result.success) {
			toast.success("Notificação processada!");
		} else {
			toast.error(result.error);
		}
	};

	// Prepare default values from inbox item
	const getDateString = (
		date: Date | string | null | undefined,
	): string | null => {
		if (!date) return null;
		if (typeof date === "string") return date.slice(0, 10);
		return date.toISOString().slice(0, 10);
	};

	const defaultPurchaseDate =
		getDateString(itemToProcess?.notificationTimestamp) ?? null;

	const defaultName = itemToProcess?.parsedName
		? itemToProcess.parsedName
				.toLowerCase()
				.replace(/\b\w/g, (char) => char.toUpperCase())
		: null;

	const defaultAmount = itemToProcess?.parsedAmount
		? String(Math.abs(Number(itemToProcess.parsedAmount)))
		: null;

	// Match sourceAppName with a cartão to pre-fill card select
	const matchedCartaoId = useMemo(() => {
		const appName = itemToProcess?.sourceAppName?.toLowerCase();
		if (!appName) return null;

		for (const option of cartaoOptions) {
			const label = option.label.toLowerCase();
			if (label.includes(appName) || appName.includes(label)) {
				return option.value;
			}
		}
		return null;
	}, [itemToProcess?.sourceAppName, cartaoOptions]);

	const renderEmptyState = (message: string) => (
		<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
			<EmptyState
				media={<RiAtLine className="size-6 text-primary" />}
				title={message}
				description="As notificações capturadas pelo app OpenMonetis Companion aparecerão aqui. Saiba mais em Ajustes > Companion."
			/>
		</Card>
	);

	const renderGrid = (list: InboxItem[], readonly?: boolean) =>
		list.length === 0 ? (
			renderEmptyState(
				readonly
					? "Nenhuma notificação nesta aba"
					: "Nenhum pré-lançamento pendente",
			)
		) : (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{list.map((item) => (
					<InboxCard
						key={item.id}
						item={item}
						readonly={readonly}
						appLogoMap={appLogoMap}
						onProcess={readonly ? undefined : handleProcessRequest}
						onDiscard={readonly ? undefined : handleDiscardRequest}
						onViewDetails={readonly ? undefined : handleDetailsRequest}
						onDelete={readonly ? handleDeleteRequest : undefined}
						onRestoreToPending={readonly ? handleRestoreRequest : undefined}
					/>
				))}
			</div>
		);

	return (
		<>
			<Tabs defaultValue="pending" className="w-full">
				<TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:h-9 sm:grid-cols-none">
					<TabsTrigger
						value="pending"
						className="h-11 min-w-0 flex-col gap-0 px-1 text-sm leading-tight sm:h-9 sm:flex-row sm:gap-1 sm:px-4"
					>
						<span>Pendentes</span>
						<span>({pendingItems.length})</span>
					</TabsTrigger>
					<TabsTrigger
						value="processed"
						className="h-11 min-w-0 flex-col gap-0 px-1 text-sm leading-tight sm:h-9 sm:flex-row sm:gap-1 sm:px-4"
					>
						<span>Processados</span>
						<span>({processedItems.length})</span>
					</TabsTrigger>
					<TabsTrigger
						value="discarded"
						className="h-11 min-w-0 flex-col gap-0 px-1 text-sm leading-tight sm:h-9 sm:flex-row sm:gap-1 sm:px-4"
					>
						<span>Descartados</span>
						<span>({discardedItems.length})</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pending" className="mt-4">
					{renderGrid(sortedPending)}
				</TabsContent>
				<TabsContent value="processed" className="mt-4">
					{sortedProcessed.length > 0 && (
						<div className="mb-4 flex justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleBulkDeleteRequest("processed")}
							>
								<RiDeleteBinLine className="mr-1.5 size-4" />
								Limpar processados
							</Button>
						</div>
					)}
					{renderGrid(sortedProcessed, true)}
				</TabsContent>
				<TabsContent value="discarded" className="mt-4">
					{sortedDiscarded.length > 0 && (
						<div className="mb-4 flex justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleBulkDeleteRequest("discarded")}
							>
								<RiDeleteBinLine className="mr-1.5 size-4" />
								Limpar descartados
							</Button>
						</div>
					)}
					{renderGrid(sortedDiscarded, true)}
				</TabsContent>
			</Tabs>

			<LancamentoDialog
				mode="create"
				open={processOpen}
				onOpenChange={handleProcessOpenChange}
				pagadorOptions={pagadorOptions}
				splitPagadorOptions={splitPagadorOptions}
				defaultPagadorId={defaultPagadorId}
				contaOptions={contaOptions}
				cartaoOptions={cartaoOptions}
				categoriaOptions={categoriaOptions}
				estabelecimentos={estabelecimentos}
				defaultPurchaseDate={defaultPurchaseDate}
				defaultName={defaultName}
				defaultAmount={defaultAmount}
				defaultCartaoId={matchedCartaoId}
				defaultPaymentMethod={matchedCartaoId ? "Cartão de crédito" : null}
				forceShowTransactionType
				onSuccess={handleLancamentoSuccess}
			/>

			<InboxDetailsDialog
				open={detailsOpen}
				onOpenChange={handleDetailsOpenChange}
				item={itemDetails}
			/>

			<ConfirmActionDialog
				open={discardOpen}
				onOpenChange={handleDiscardOpenChange}
				title="Descartar notificação?"
				description="A notificação será marcada como descartada e não aparecerá mais na lista de pendentes."
				confirmLabel="Descartar"
				confirmVariant="destructive"
				pendingLabel="Descartando..."
				onConfirm={handleDiscardConfirm}
			/>

			<ConfirmActionDialog
				open={deleteOpen}
				onOpenChange={handleDeleteOpenChange}
				title="Excluir notificação?"
				description="A notificação será excluída permanentemente."
				confirmLabel="Excluir"
				confirmVariant="destructive"
				pendingLabel="Excluindo..."
				onConfirm={handleDeleteConfirm}
			/>

			<ConfirmActionDialog
				open={restoreOpen}
				onOpenChange={handleRestoreOpenChange}
				title="Retornar para pendentes?"
				description="A notificação voltará para a lista de pendentes e poderá ser processada depois."
				confirmLabel="Retornar"
				pendingLabel="Retornando..."
				onConfirm={handleRestoreToPendingConfirm}
			/>

			<ConfirmActionDialog
				open={bulkDeleteOpen}
				onOpenChange={handleBulkDeleteOpenChange}
				title={`Limpar ${bulkDeleteStatus === "processed" ? "processados" : "descartados"}?`}
				description={`Todos os itens ${bulkDeleteStatus === "processed" ? "processados" : "descartados"} serão excluídos permanentemente.`}
				confirmLabel="Limpar tudo"
				confirmVariant="destructive"
				pendingLabel="Excluindo..."
				onConfirm={handleBulkDeleteConfirm}
			/>
		</>
	);
}
