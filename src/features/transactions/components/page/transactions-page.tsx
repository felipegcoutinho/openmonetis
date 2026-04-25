"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
	createMassTransactionsAction,
	deleteMultipleTransactionsAction,
	deleteTransactionAction,
	deleteTransactionBulkAction,
	toggleTransactionSettlementAction,
	updateTransactionAction,
	updateTransactionBulkAction,
	updateTransactionSplitPairAction,
} from "@/features/transactions/actions";
import {
	confirmAttachmentUploadAction,
	detachAttachmentBulkAction,
	getPresignedUploadUrlAction,
} from "@/features/transactions/actions/attachments";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import type {
	TransactionsExportContext,
	TransactionsPaginationState,
} from "../../export-types";
import { AnticipateInstallmentsDialog } from "../dialogs/anticipate-installments-dialog/anticipate-installments-dialog";
import { AnticipationHistoryDialog } from "../dialogs/anticipate-installments-dialog/anticipation-history-dialog";
import {
	BulkActionDialog,
	type BulkActionScope,
} from "../dialogs/bulk-action-dialog";
import { BulkImportDialog } from "../dialogs/bulk-import-dialog";
import {
	MassAddDialog,
	type MassAddFormData,
} from "../dialogs/mass-add-dialog";
import {
	SplitPairDialog,
	type SplitPairScope,
} from "../dialogs/split-pair-dialog";
import { TransactionDetailsDialog } from "../dialogs/transaction-details-dialog";
import { TransactionDialog } from "../dialogs/transaction-dialog/transaction-dialog";
import { TransactionsTable } from "../table/transactions-table";
import type {
	AccountCardFilterOption,
	SelectOption,
	TransactionFilterOption,
	TransactionItem,
} from "../types";

interface TransactionsPageProps {
	currentUserId: string;
	transactions: TransactionItem[];
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	payerFilterOptions: TransactionFilterOption[];
	categoryFilterOptions: TransactionFilterOption[];
	accountCardFilterOptions: AccountCardFilterOption[];
	selectedPeriod: string;
	estabelecimentos: string[];
	allowCreate?: boolean;
	noteAsColumn?: boolean;
	columnOrder?: string[] | null;
	defaultCardId?: string | null;
	defaultPaymentMethod?: string | null;
	lockCardSelection?: boolean;
	lockPaymentMethod?: boolean;
	pagination?: TransactionsPaginationState;
	exportContext?: TransactionsExportContext;
	attachmentMaxSizeMb?: number;
	// Opções específicas para o dialog de importação (quando visualizando dados de outro usuário)
	importPayerOptions?: SelectOption[];
	importSplitPayerOptions?: SelectOption[];
	importDefaultPayerId?: string | null;
	importAccountOptions?: SelectOption[];
	importCardOptions?: SelectOption[];
	importCategoryOptions?: SelectOption[];
}

export function TransactionsPage({
	currentUserId,
	transactions: transactionList,
	payerOptions,
	splitPayerOptions,
	defaultPayerId,
	accountOptions,
	cardOptions,
	categoryOptions,
	payerFilterOptions,
	categoryFilterOptions,
	accountCardFilterOptions,
	selectedPeriod,
	estabelecimentos,
	allowCreate = true,
	noteAsColumn = false,
	columnOrder = null,
	defaultCardId,
	defaultPaymentMethod,
	lockCardSelection,
	lockPaymentMethod,
	pagination,
	exportContext,
	attachmentMaxSizeMb,
	importPayerOptions,
	importSplitPayerOptions,
	importDefaultPayerId,
	importAccountOptions,
	importCardOptions,
	importCategoryOptions,
}: TransactionsPageProps) {
	const [selectedTransaction, setSelectedTransaction] =
		useState<TransactionItem | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [copyOpen, setCopyOpen] = useState(false);
	const [transactionToCopy, setTransactionToCopy] =
		useState<TransactionItem | null>(null);
	const [importOpen, setImportOpen] = useState(false);
	const [transactionToImport, setTransactionToImport] =
		useState<TransactionItem | null>(null);
	const [massAddOpen, setMassAddOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [transactionToDelete, setTransactionToDelete] =
		useState<TransactionItem | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [settlementLoadingId, setSettlementLoadingId] = useState<string | null>(
		null,
	);
	const [bulkEditOpen, setBulkEditOpen] = useState(false);
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [pendingSplitEditData, setPendingSplitEditData] = useState<{
		id: string;
		name: string;
		purchaseDate: string;
		period: string;
		transactionType: string;
		amount: number;
		condition: string;
		paymentMethod: string;
		payerId: string | undefined;
		accountId: string | undefined;
		cardId: string | undefined;
		categoryId: string | undefined;
		note: string;
		isSettled: boolean | null;
		dueDate: string | null;
		boletoPaymentDate: string | null;
		pendingDetachIds: string[];
		pendingUploadFiles: File[];
	} | null>(null);
	const [pendingEditData, setPendingEditData] = useState<{
		id: string;
		purchaseDate: string;
		period: string;
		name: string;
		categoryId: string | undefined;
		note: string;
		payerId: string | undefined;
		accountId: string | undefined;
		cardId: string | undefined;
		amount: number;
		dueDate: string | null;
		boletoPaymentDate: string | null;
		isSettled: boolean | null;
		pendingDetachIds: string[];
		pendingUploadFiles: File[];
		transaction: TransactionItem;
	} | null>(null);
	const [pendingDeleteData, setPendingDeleteData] =
		useState<TransactionItem | null>(null);
	const [multipleBulkDeleteOpen, setMultipleBulkDeleteOpen] = useState(false);
	const [pendingMultipleDeleteData, setPendingMultipleDeleteData] = useState<
		TransactionItem[]
	>([]);
	const [anticipateOpen, setAnticipateOpen] = useState(false);
	const [anticipationHistoryOpen, setAnticipationHistoryOpen] = useState(false);
	const [selectedForAnticipation, setSelectedForAnticipation] =
		useState<TransactionItem | null>(null);
	const [bulkImportOpen, setBulkImportOpen] = useState(false);
	const [transactionsToImport, setTransactionsToImport] = useState<
		TransactionItem[]
	>([]);

	const handleToggleSettlement = async (item: TransactionItem) => {
		if (item.paymentMethod === "Cartão de crédito") {
			toast.info(
				"Pagamentos com cartão são conciliados automaticamente. Ajuste pelo cartão.",
			);
			return;
		}

		const supportedMethods = [
			"Pix",
			"Boleto",
			"Dinheiro",
			"Cartão de débito",
			"Pré-Pago | VR/VA",
			"Transferência bancária",
		];
		if (!supportedMethods.includes(item.paymentMethod)) {
			return;
		}

		const nextValue = !item.isSettled;

		try {
			setSettlementLoadingId(item.id);
			const result = await toggleTransactionSettlementAction({
				id: item.id,
				value: nextValue,
			});

			if (!result.success) {
				throw new Error(result.error);
			}

			toast.success(
				nextValue
					? `"${item.name}" marcado como pago`
					: `"${item.name}" marcado como não pago`,
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o pagamento.";
			toast.error(message);
		} finally {
			setSettlementLoadingId(null);
		}
	};

	const handleDelete = async () => {
		if (!transactionToDelete) {
			return;
		}

		const result = await deleteTransactionAction({
			id: transactionToDelete.id,
		});

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		toast.success(result.message);
		setDeleteOpen(false);
	};

	const handleBulkDelete = async (scope: BulkActionScope) => {
		if (!pendingDeleteData) {
			return;
		}

		const result = await deleteTransactionBulkAction({
			id: pendingDeleteData.id,
			scope,
		});

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		toast.success(result.message);
		setBulkDeleteOpen(false);
		setPendingDeleteData(null);
	};

	const handleBulkEditRequest = (data: {
		id: string;
		purchaseDate: string;
		period: string;
		name: string;
		categoryId: string | undefined;
		note: string;
		payerId: string | undefined;
		accountId: string | undefined;
		cardId: string | undefined;
		amount: number;
		dueDate: string | null;
		boletoPaymentDate: string | null;
		isSettled: boolean | null;
		pendingDetachIds: string[];
		pendingUploadFiles: File[];
	}) => {
		if (!selectedTransaction) {
			return;
		}

		setPendingEditData({
			...data,
			transaction: selectedTransaction,
		});
		setEditOpen(false);
		setBulkEditOpen(true);
	};

	const handleBulkEdit = async (scope: BulkActionScope) => {
		if (!pendingEditData) {
			return;
		}

		const result = await updateTransactionBulkAction({
			id: pendingEditData.id,
			scope,
			purchaseDate: pendingEditData.purchaseDate,
			period: pendingEditData.period,
			name: pendingEditData.name,
			categoryId: pendingEditData.categoryId,
			note: pendingEditData.note,
			payerId: pendingEditData.payerId,
			accountId: pendingEditData.accountId,
			cardId: pendingEditData.cardId,
			amount: pendingEditData.amount,
			dueDate: pendingEditData.dueDate,
			boletoPaymentDate: pendingEditData.boletoPaymentDate,
			isSettled: pendingEditData.isSettled ?? undefined,
		});

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		// Propaga remoções de anexo pendentes com o mesmo escopo
		for (const attachmentId of pendingEditData.pendingDetachIds) {
			await detachAttachmentBulkAction({
				attachmentId,
				transactionId: pendingEditData.id,
				scope,
			});
		}

		// Faz upload dos arquivos pendentes e confirma com o escopo escolhido
		for (const file of pendingEditData.pendingUploadFiles) {
			const presign = await getPresignedUploadUrlAction({
				fileName: file.name,
				mimeType: file.type,
				fileSize: file.size,
				transactionId: pendingEditData.id,
			});
			if (presign.success) {
				await fetch(presign.presignedUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				await confirmAttachmentUploadAction({
					uploadToken: presign.uploadToken,
					scope,
				});
			}
		}

		toast.success(result.message);
		setBulkEditOpen(false);
		setPendingEditData(null);
	};

	const handleMassAddSubmit = async (data: MassAddFormData) => {
		const result = await createMassTransactionsAction(data);

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		toast.success(result.message);
	};

	const handleMultipleBulkDelete = (items: TransactionItem[]) => {
		// Se todos os selecionados são da mesma série (parcelado/recorrente), abrir dialog de escopo
		const withSeries = items.filter((i) => i.seriesId);
		const sameSeries =
			withSeries.length > 0 &&
			withSeries.length === items.length &&
			withSeries.every((i) => i.seriesId === withSeries[0]?.seriesId);
		if (sameSeries && withSeries[0]) {
			setPendingDeleteData(withSeries[0]);
			setBulkDeleteOpen(true);
			return;
		}
		setPendingMultipleDeleteData(items);
		setMultipleBulkDeleteOpen(true);
	};

	const confirmMultipleBulkDelete = async () => {
		if (pendingMultipleDeleteData.length === 0) {
			return;
		}

		const ids = pendingMultipleDeleteData.map((item) => item.id);
		const result = await deleteMultipleTransactionsAction({ ids });

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		toast.success(result.message);
		setMultipleBulkDeleteOpen(false);
		setPendingMultipleDeleteData([]);
	};

	const [transactionTypeForCreate, setTransactionTypeForCreate] = useState<
		"Despesa" | "Receita" | null
	>(null);

	const handleCreate = (type: "Despesa" | "Receita") => {
		setTransactionTypeForCreate(type);
		setCreateOpen(true);
	};

	const handleMassAdd = () => {
		setMassAddOpen(true);
	};

	const handleSplitEditRequest = (
		data: NonNullable<typeof pendingSplitEditData>,
	) => {
		setPendingSplitEditData(data);
		setEditOpen(false);
	};

	const handleSplitEdit = async (scope: SplitPairScope) => {
		if (!pendingSplitEditData) {
			return;
		}

		const payload = {
			id: pendingSplitEditData.id,
			name: pendingSplitEditData.name,
			purchaseDate: pendingSplitEditData.purchaseDate,
			period: pendingSplitEditData.period,
			transactionType: pendingSplitEditData.transactionType as Parameters<
				typeof updateTransactionAction
			>[0]["transactionType"],
			amount: pendingSplitEditData.amount,
			condition: pendingSplitEditData.condition as Parameters<
				typeof updateTransactionAction
			>[0]["condition"],
			paymentMethod: pendingSplitEditData.paymentMethod as Parameters<
				typeof updateTransactionAction
			>[0]["paymentMethod"],
			payerId: pendingSplitEditData.payerId ?? null,
			accountId: pendingSplitEditData.accountId ?? null,
			cardId: pendingSplitEditData.cardId ?? null,
			categoryId: pendingSplitEditData.categoryId ?? null,
			note: pendingSplitEditData.note,
			isSettled: pendingSplitEditData.isSettled,
			dueDate: pendingSplitEditData.dueDate ?? undefined,
			boletoPaymentDate: pendingSplitEditData.boletoPaymentDate ?? undefined,
			isSplit: false,
		};

		const action =
			scope === "both"
				? updateTransactionSplitPairAction
				: updateTransactionAction;
		const result = await action(payload);

		if (!result.success) {
			toast.error(result.error);
			throw new Error(result.error);
		}

		await Promise.all(
			pendingSplitEditData.pendingDetachIds.map((attachmentId) =>
				detachAttachmentBulkAction({
					attachmentId,
					transactionId: pendingSplitEditData.id,
					scope: "current",
				}),
			),
		);

		await Promise.all(
			pendingSplitEditData.pendingUploadFiles.map(async (file) => {
				const presign = await getPresignedUploadUrlAction({
					fileName: file.name,
					mimeType: file.type,
					fileSize: file.size,
					transactionId: pendingSplitEditData.id,
				});
				if (!presign.success) return;
				await fetch(presign.presignedUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				await confirmAttachmentUploadAction({
					uploadToken: presign.uploadToken,
					scope: "current",
				});
			}),
		);

		toast.success(result.message);
		setPendingSplitEditData(null);
	};

	const handleEdit = (item: TransactionItem) => {
		setSelectedTransaction(item);
		setEditOpen(true);
	};

	const handleCopy = (item: TransactionItem) => {
		setTransactionToCopy(item);
		setCopyOpen(true);
	};

	const handleImport = (item: TransactionItem) => {
		setTransactionToImport(item);
		setImportOpen(true);
	};

	const handleBulkImport = (items: TransactionItem[]) => {
		setTransactionsToImport(items);
		setBulkImportOpen(true);
	};

	const handleConfirmDelete = (item: TransactionItem) => {
		if (item.seriesId) {
			setPendingDeleteData(item);
			setBulkDeleteOpen(true);
		} else {
			setTransactionToDelete(item);
			setDeleteOpen(true);
		}
	};

	const handleViewDetails = (item: TransactionItem) => {
		setSelectedTransaction(item);
		setDetailsOpen(true);
	};

	const handleAnticipate = (item: TransactionItem) => {
		setSelectedForAnticipation(item);
		setAnticipateOpen(true);
	};

	const handleViewAnticipationHistory = (item: TransactionItem) => {
		setSelectedForAnticipation(item);
		setAnticipationHistoryOpen(true);
	};

	return (
		<>
			<TransactionsTable
				data={transactionList}
				currentUserId={currentUserId}
				noteAsColumn={noteAsColumn}
				columnOrder={columnOrder}
				payerFilterOptions={payerFilterOptions}
				categoryFilterOptions={categoryFilterOptions}
				accountCardFilterOptions={accountCardFilterOptions}
				selectedPeriod={selectedPeriod}
				pagination={pagination}
				exportContext={exportContext}
				onCreate={allowCreate ? handleCreate : undefined}
				onMassAdd={allowCreate ? handleMassAdd : undefined}
				onEdit={handleEdit}
				onCopy={handleCopy}
				onImport={handleImport}
				onConfirmDelete={handleConfirmDelete}
				onBulkDelete={handleMultipleBulkDelete}
				onBulkImport={handleBulkImport}
				onViewDetails={handleViewDetails}
				onToggleSettlement={handleToggleSettlement}
				onAnticipate={handleAnticipate}
				onViewAnticipationHistory={handleViewAnticipationHistory}
				isSettlementLoading={(id) => settlementLoadingId === id}
			/>

			{allowCreate ? (
				<TransactionDialog
					mode="create"
					open={createOpen}
					onOpenChange={setCreateOpen}
					payerOptions={payerOptions}
					splitPayerOptions={splitPayerOptions}
					defaultPayerId={defaultPayerId}
					accountOptions={accountOptions}
					cardOptions={cardOptions}
					categoryOptions={categoryOptions}
					estabelecimentos={estabelecimentos}
					defaultPeriod={selectedPeriod}
					defaultCardId={defaultCardId}
					defaultPaymentMethod={defaultPaymentMethod}
					lockCardSelection={lockCardSelection}
					lockPaymentMethod={lockPaymentMethod}
					defaultTransactionType={transactionTypeForCreate ?? undefined}
					maxSizeMb={attachmentMaxSizeMb}
				/>
			) : null}

			<TransactionDialog
				mode="create"
				open={copyOpen && !!transactionToCopy}
				onOpenChange={(open) => {
					setCopyOpen(open);
					if (!open) {
						setTransactionToCopy(null);
					}
				}}
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				estabelecimentos={estabelecimentos}
				transaction={transactionToCopy ?? undefined}
				defaultPeriod={selectedPeriod}
				maxSizeMb={attachmentMaxSizeMb}
			/>

			<TransactionDialog
				mode="create"
				open={importOpen && !!transactionToImport}
				onOpenChange={(open) => {
					setImportOpen(open);
					if (!open) {
						setTransactionToImport(null);
					}
				}}
				payerOptions={importPayerOptions ?? payerOptions}
				splitPayerOptions={importSplitPayerOptions ?? splitPayerOptions}
				defaultPayerId={importDefaultPayerId ?? defaultPayerId}
				accountOptions={importAccountOptions ?? accountOptions}
				cardOptions={importCardOptions ?? cardOptions}
				categoryOptions={importCategoryOptions ?? categoryOptions}
				estabelecimentos={estabelecimentos}
				transaction={transactionToImport ?? undefined}
				defaultPeriod={selectedPeriod}
				isImporting={true}
				maxSizeMb={attachmentMaxSizeMb}
			/>

			<BulkImportDialog
				open={bulkImportOpen && transactionsToImport.length > 0}
				onOpenChange={setBulkImportOpen}
				items={transactionsToImport}
				payerOptions={importPayerOptions ?? payerOptions}
				accountOptions={importAccountOptions ?? accountOptions}
				cardOptions={importCardOptions ?? cardOptions}
				categoryOptions={importCategoryOptions ?? categoryOptions}
				defaultPayerId={importDefaultPayerId ?? defaultPayerId}
			/>

			<TransactionDialog
				mode="update"
				open={editOpen && !!selectedTransaction}
				onOpenChange={setEditOpen}
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				estabelecimentos={estabelecimentos}
				transaction={selectedTransaction ?? undefined}
				defaultPeriod={selectedPeriod}
				onBulkEditRequest={handleBulkEditRequest}
				onSplitEditRequest={handleSplitEditRequest}
				maxSizeMb={attachmentMaxSizeMb}
			/>

			<TransactionDetailsDialog
				open={detailsOpen && !!selectedTransaction}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedTransaction(null);
					}
				}}
				transaction={detailsOpen ? selectedTransaction : null}
				onEdit={handleEdit}
			/>

			<ConfirmActionDialog
				open={deleteOpen && !!transactionToDelete}
				onOpenChange={setDeleteOpen}
				title={
					transactionToDelete
						? `Remover lançamento "${transactionToDelete.name}"?`
						: "Remover lançamento?"
				}
				description="Essa ação é irreversível e removerá o lançamento de forma permanente."
				confirmLabel="Remover"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleDelete}
				disabled={!transactionToDelete}
			/>

			<BulkActionDialog
				open={bulkDeleteOpen && !!pendingDeleteData}
				onOpenChange={setBulkDeleteOpen}
				actionType="delete"
				seriesType={
					pendingDeleteData?.condition === "Parcelado"
						? "installment"
						: "recurring"
				}
				currentNumber={pendingDeleteData?.currentInstallment ?? undefined}
				totalCount={
					pendingDeleteData?.installmentCount ??
					pendingDeleteData?.recurrenceCount ??
					undefined
				}
				onConfirm={handleBulkDelete}
			/>

			<BulkActionDialog
				open={bulkEditOpen && !!pendingEditData}
				onOpenChange={setBulkEditOpen}
				actionType="edit"
				seriesType={
					pendingEditData?.transaction.condition === "Parcelado"
						? "installment"
						: "recurring"
				}
				currentNumber={
					pendingEditData?.transaction.currentInstallment ?? undefined
				}
				totalCount={
					pendingEditData?.transaction.installmentCount ??
					pendingEditData?.transaction.recurrenceCount ??
					undefined
				}
				onConfirm={handleBulkEdit}
			/>

			<SplitPairDialog
				open={pendingSplitEditData !== null}
				onOpenChange={(open) => {
					if (!open) setPendingSplitEditData(null);
				}}
				onConfirm={handleSplitEdit}
			/>

			{allowCreate && massAddOpen ? (
				<MassAddDialog
					open={massAddOpen}
					onOpenChange={setMassAddOpen}
					onSubmit={handleMassAddSubmit}
					payerOptions={payerOptions}
					accountOptions={accountOptions}
					cardOptions={cardOptions}
					categoryOptions={categoryOptions}
					estabelecimentos={estabelecimentos}
					selectedPeriod={selectedPeriod}
					defaultPayerId={defaultPayerId}
					defaultCardId={defaultCardId}
				/>
			) : null}

			<ConfirmActionDialog
				open={multipleBulkDeleteOpen && pendingMultipleDeleteData.length > 0}
				onOpenChange={setMultipleBulkDeleteOpen}
				title={`Remover ${pendingMultipleDeleteData.length} ${
					pendingMultipleDeleteData.length === 1 ? "lançamento" : "lançamentos"
				}?`}
				description="Essa ação é irreversível e removerá os lançamentos selecionados de forma permanente."
				confirmLabel="Remover"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={confirmMultipleBulkDelete}
				disabled={pendingMultipleDeleteData.length === 0}
			/>

			{/* Dialogs de Antecipação */}
			{selectedForAnticipation && (
				<AnticipateInstallmentsDialog
					open={anticipateOpen}
					onOpenChange={setAnticipateOpen}
					seriesId={selectedForAnticipation.seriesId as string}
					lancamentoName={selectedForAnticipation.name}
					categorias={categoryOptions.map((c) => ({
						id: c.value,
						name: c.label,
						icon: c.icon ?? null,
					}))}
					pagadores={payerOptions.map((p) => ({
						id: p.value,
						name: p.label,
					}))}
					defaultPeriod={selectedPeriod}
				/>
			)}

			{selectedForAnticipation && (
				<AnticipationHistoryDialog
					open={anticipationHistoryOpen}
					onOpenChange={setAnticipationHistoryOpen}
					seriesId={selectedForAnticipation.seriesId as string}
					lancamentoName={selectedForAnticipation.name}
					onViewLancamento={(transactionId) => {
						const transaction = transactionList.find(
							(l) => l.id === transactionId,
						);
						if (transaction) {
							setSelectedTransaction(transaction);
							setDetailsOpen(true);
							setAnticipationHistoryOpen(false);
						}
					}}
				/>
			)}
		</>
	);
}
