"use client";

import { RiAtLine, RiDeleteBinLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	bulkDeleteInboxItemsAction,
	deleteInboxItemAction,
	discardInboxItemAction,
	markInboxAsProcessedAction,
} from "@/app/(dashboard)/pre-lancamentos/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { LancamentoDialog } from "@/components/lancamentos/dialogs/lancamento-dialog/lancamento-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [bulkDeleteStatus, setBulkDeleteStatus] = useState<
		"processed" | "discarded"
	>("processed");

	const sortByTimestamp = useCallback(
		(list: InboxItem[]) =>
			[...list].sort(
				(a, b) =>
					new Date(b.notificationTimestamp).getTime() -
					new Date(a.notificationTimestamp).getTime(),
			),
		[],
	);

	const sortedPending = useMemo(
		() => sortByTimestamp(pendingItems),
		[pendingItems, sortByTimestamp],
	);
	const sortedProcessed = useMemo(
		() => sortByTimestamp(processedItems),
		[processedItems, sortByTimestamp],
	);
	const sortedDiscarded = useMemo(
		() => sortByTimestamp(discardedItems),
		[discardedItems, sortByTimestamp],
	);

	const handleProcessOpenChange = useCallback((open: boolean) => {
		setProcessOpen(open);
		if (!open) {
			setItemToProcess(null);
		}
	}, []);

	const handleDetailsOpenChange = useCallback((open: boolean) => {
		setDetailsOpen(open);
		if (!open) {
			setItemDetails(null);
		}
	}, []);

	const handleDiscardOpenChange = useCallback((open: boolean) => {
		setDiscardOpen(open);
		if (!open) {
			setItemToDiscard(null);
		}
	}, []);

	const handleProcessRequest = useCallback((item: InboxItem) => {
		setItemToProcess(item);
		setProcessOpen(true);
	}, []);

	const handleDetailsRequest = useCallback((item: InboxItem) => {
		setItemDetails(item);
		setDetailsOpen(true);
	}, []);

	const handleDiscardRequest = useCallback((item: InboxItem) => {
		setItemToDiscard(item);
		setDiscardOpen(true);
	}, []);

	const handleDiscardConfirm = useCallback(async () => {
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
	}, [itemToDiscard]);

	const handleDeleteOpenChange = useCallback((open: boolean) => {
		setDeleteOpen(open);
		if (!open) {
			setItemToDelete(null);
		}
	}, []);

	const handleDeleteRequest = useCallback((item: InboxItem) => {
		setItemToDelete(item);
		setDeleteOpen(true);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
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
	}, [itemToDelete]);

	const handleBulkDeleteOpenChange = useCallback((open: boolean) => {
		setBulkDeleteOpen(open);
	}, []);

	const handleBulkDeleteRequest = useCallback(
		(status: "processed" | "discarded") => {
			setBulkDeleteStatus(status);
			setBulkDeleteOpen(true);
		},
		[],
	);

	const handleBulkDeleteConfirm = useCallback(async () => {
		const result = await bulkDeleteInboxItemsAction({
			status: bulkDeleteStatus,
		});

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [bulkDeleteStatus]);

	const handleLancamentoSuccess = useCallback(async () => {
		if (!itemToProcess) return;

		const result = await markInboxAsProcessedAction({
			inboxItemId: itemToProcess.id,
		});

		if (result.success) {
			toast.success("Notificação processada!");
		} else {
			toast.error(result.error);
		}
	}, [itemToProcess]);

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
					/>
				))}
			</div>
		);

	return (
		<>
			<Tabs defaultValue="pending" className="w-full">
				<TabsList>
					<TabsTrigger value="pending">
						Pendentes ({pendingItems.length})
					</TabsTrigger>
					<TabsTrigger value="processed">
						Processados ({processedItems.length})
					</TabsTrigger>
					<TabsTrigger value="discarded">
						Descartados ({discardedItems.length})
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
