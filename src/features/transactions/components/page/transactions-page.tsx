"use client";

import { RiAddFill } from "@remixicon/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	convertTransactionToInstallmentAction,
	convertTransactionToRecurringAction,
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
import { detectInstallmentFromName } from "@/features/transactions/lib/installment-detection";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatCurrency } from "@/shared/utils/currency";
import type {
	TransactionsExportContext,
	TransactionsPaginationState,
} from "../../lib/export-types";
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
import { RefundTransactionDialog } from "../dialogs/refund-transaction-dialog";
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
	defaultAccountId?: string | null;
	estabelecimentos: string[];
	allowCreate?: boolean;
	noteAsColumn?: boolean;
	columnOrder?: string[] | null;
	groupTransactionsByDate?: boolean;
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

const pluralize = (count: number, singular: string, plural: string) =>
	count === 1 ? singular : plural;

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
	defaultAccountId,
	estabelecimentos,
	allowCreate = true,
	noteAsColumn = false,
	columnOrder = null,
	groupTransactionsByDate = true,
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
	const [refundOpen, setRefundOpen] = useState(false);
	const [transactionToRefund, setTransactionToRefund] =
		useState<TransactionItem | null>(null);
	const [convertInstallmentOpen, setConvertInstallmentOpen] = useState(false);
	const [transactionToConvert, setTransactionToConvert] =
		useState<TransactionItem | null>(null);
	const [installmentCount, setInstallmentCount] = useState("2");
	const [installmentPending, setInstallmentPending] = useState(false);
	const [convertRecurringOpen, setConvertRecurringOpen] = useState(false);
	const [transactionToConvertRecurring, setTransactionToConvertRecurring] =
		useState<TransactionItem | null>(null);
	const [recurrenceCount, setRecurrenceCount] = useState("12");
	const [recurrencePending, setRecurrencePending] = useState(false);

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

	const handleRefund = (item: TransactionItem) => {
		setTransactionToRefund(item);
		setRefundOpen(true);
	};

	const handleConvertToInstallment = (item: TransactionItem) => {
		const detectedInstallment = detectInstallmentFromName(item.name);
		setTransactionToConvert(item);
		setInstallmentCount(String(detectedInstallment?.installmentCount ?? 2));
		setConvertInstallmentOpen(true);
	};

	const confirmConvertToInstallment = async () => {
		if (!transactionToConvert) {
			return;
		}

		const count = Number(installmentCount);
		if (!Number.isInteger(count) || count < 2 || count > 60) {
			toast.error("Informe um parcelamento entre 2 e 60 parcelas.");
			return;
		}

		try {
			setInstallmentPending(true);
			const result = await convertTransactionToInstallmentAction({
				id: transactionToConvert.id,
				installmentCount: count,
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			toast.success(result.message);
			setConvertInstallmentOpen(false);
			setTransactionToConvert(null);
		} finally {
			setInstallmentPending(false);
		}
	};

	const handleConvertToRecurring = (item: TransactionItem) => {
		setTransactionToConvertRecurring(item);
		setRecurrenceCount("12");
		setConvertRecurringOpen(true);
	};

	const confirmConvertToRecurring = async () => {
		if (!transactionToConvertRecurring) {
			return;
		}

		const count = Number(recurrenceCount);
		if (!Number.isInteger(count) || count < 2 || count > 60) {
			toast.error("Informe uma recorrência entre 2 e 60 meses.");
			return;
		}

		try {
			setRecurrencePending(true);
			const result = await convertTransactionToRecurringAction({
				id: transactionToConvertRecurring.id,
				recurrenceCount: count,
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			toast.success(result.message);
			setConvertRecurringOpen(false);
			setTransactionToConvertRecurring(null);
		} finally {
			setRecurrencePending(false);
		}
	};

	const parsedInstallmentCount = Number(installmentCount);
	const installmentSummary =
		transactionToConvert &&
		Number.isInteger(parsedInstallmentCount) &&
		parsedInstallmentCount >= 2 &&
		parsedInstallmentCount <= 60
			? {
					total: formatCurrency(Math.abs(transactionToConvert.amount)),
					installmentValue: formatCurrency(
						Math.abs(transactionToConvert.amount) / parsedInstallmentCount,
					),
					count: parsedInstallmentCount,
					createdCount: parsedInstallmentCount - 1,
				}
			: null;

	const parsedRecurrenceCount = Number(recurrenceCount);
	const recurringSummary =
		transactionToConvertRecurring &&
		Number.isInteger(parsedRecurrenceCount) &&
		parsedRecurrenceCount >= 2 &&
		parsedRecurrenceCount <= 60
			? {
					amount: formatCurrency(
						Math.abs(transactionToConvertRecurring.amount),
					),
					count: parsedRecurrenceCount,
					createdCount: parsedRecurrenceCount - 1,
				}
			: null;

	const handleAnticipate = (item: TransactionItem) => {
		setSelectedForAnticipation(item);
		setAnticipateOpen(true);
	};

	const handleViewAnticipationHistory = (item: TransactionItem) => {
		setSelectedForAnticipation(item);
		setAnticipationHistoryOpen(true);
	};

	const createSlot = allowCreate ? (
		<>
			<TransactionDialog
				mode="create"
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				estabelecimentos={estabelecimentos}
				defaultPeriod={selectedPeriod}
				defaultAccountId={defaultAccountId}
				defaultCardId={defaultCardId}
				defaultPaymentMethod={defaultPaymentMethod}
				lockCardSelection={lockCardSelection}
				lockPaymentMethod={lockPaymentMethod}
				defaultTransactionType="Receita"
				maxSizeMb={attachmentMaxSizeMb}
				trigger={
					<Button className="w-full sm:w-auto">
						<RiAddFill className="size-4" />
						Nova Receita
					</Button>
				}
			/>
			<TransactionDialog
				mode="create"
				payerOptions={payerOptions}
				splitPayerOptions={splitPayerOptions}
				defaultPayerId={defaultPayerId}
				accountOptions={accountOptions}
				cardOptions={cardOptions}
				categoryOptions={categoryOptions}
				estabelecimentos={estabelecimentos}
				defaultPeriod={selectedPeriod}
				defaultAccountId={defaultAccountId}
				defaultCardId={defaultCardId}
				defaultPaymentMethod={defaultPaymentMethod}
				lockCardSelection={lockCardSelection}
				lockPaymentMethod={lockPaymentMethod}
				defaultTransactionType="Despesa"
				maxSizeMb={attachmentMaxSizeMb}
				trigger={
					<Button className="w-full sm:w-auto">
						<RiAddFill className="size-4" />
						Nova Despesa
					</Button>
				}
			/>
		</>
	) : null;

	return (
		<>
			<TransactionsTable
				data={transactionList}
				currentUserId={currentUserId}
				noteAsColumn={noteAsColumn}
				columnOrder={columnOrder}
				groupTransactionsByDate={groupTransactionsByDate}
				payerFilterOptions={payerFilterOptions}
				categoryFilterOptions={categoryFilterOptions}
				accountCardFilterOptions={accountCardFilterOptions}
				selectedPeriod={selectedPeriod}
				pagination={pagination}
				exportContext={exportContext}
				createSlot={createSlot}
				onMassAdd={allowCreate ? handleMassAdd : undefined}
				onEdit={handleEdit}
				onCopy={handleCopy}
				onImport={handleImport}
				onConfirmDelete={handleConfirmDelete}
				onBulkDelete={handleMultipleBulkDelete}
				onBulkImport={handleBulkImport}
				onViewDetails={handleViewDetails}
				onRefund={handleRefund}
				onConvertToInstallment={handleConvertToInstallment}
				onConvertToRecurring={handleConvertToRecurring}
				onToggleSettlement={handleToggleSettlement}
				onAnticipate={handleAnticipate}
				onViewAnticipationHistory={handleViewAnticipationHistory}
				isSettlementLoading={(id) => settlementLoadingId === id}
			/>

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
				defaultAccountId={defaultAccountId}
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
				defaultAccountId={defaultAccountId}
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
				defaultAccountId={defaultAccountId}
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

			<RefundTransactionDialog
				open={refundOpen && !!transactionToRefund}
				onOpenChange={(open) => {
					setRefundOpen(open);
					if (!open) {
						setTransactionToRefund(null);
					}
				}}
				transaction={transactionToRefund}
				cardOptions={cardOptions}
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

			<Dialog
				open={convertInstallmentOpen && !!transactionToConvert}
				onOpenChange={(open) => {
					setConvertInstallmentOpen(open);
					if (!open) {
						setTransactionToConvert(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Converter em parcelamento?</DialogTitle>
						<DialogDescription>
							O lançamento atual será mantido como a primeira parcela e os
							próximos meses serão criados automaticamente.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<Label htmlFor="installmentCount">Parcelar em</Label>
						<Input
							id="installmentCount"
							type="number"
							min={2}
							max={60}
							value={installmentCount}
							onChange={(event) => setInstallmentCount(event.target.value)}
						/>
						<p className="text-muted-foreground text-sm">
							Use o total de parcelas da série, incluindo este lançamento.
						</p>
						{installmentSummary ? (
							<p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
								Resumo: {installmentSummary.total} será dividido em{" "}
								{installmentSummary.count} parcelas de aproximadamente{" "}
								{installmentSummary.installmentValue}. Este lançamento vira a
								primeira parcela e {installmentSummary.createdCount}{" "}
								{pluralize(
									installmentSummary.createdCount,
									"nova parcela será criada",
									"novas parcelas serão criadas",
								)}
								.
							</p>
						) : null}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setConvertInstallmentOpen(false)}
							disabled={installmentPending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={confirmConvertToInstallment}
							disabled={installmentPending}
						>
							{installmentPending ? "Convertendo..." : "Converter"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={convertRecurringOpen && !!transactionToConvertRecurring}
				onOpenChange={(open) => {
					setConvertRecurringOpen(open);
					if (!open) {
						setTransactionToConvertRecurring(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Converter em recorrente?</DialogTitle>
						<DialogDescription>
							O lançamento atual será mantido como a primeira recorrência e os
							próximos meses serão criados automaticamente.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<Label htmlFor="recurrenceCount">Repetir por</Label>
						<Input
							id="recurrenceCount"
							type="number"
							min={2}
							max={60}
							value={recurrenceCount}
							onChange={(event) => setRecurrenceCount(event.target.value)}
						/>
						<p className="text-muted-foreground text-sm">
							Use o total de meses da série, incluindo este lançamento.
						</p>
						{recurringSummary ? (
							<p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
								Resumo: este lançamento vira a primeira recorrência e{" "}
								{recurringSummary.createdCount}{" "}
								{pluralize(
									recurringSummary.createdCount,
									"novo lançamento mensal será criado",
									"novos lançamentos mensais serão criados",
								)}{" "}
								com valor de {recurringSummary.amount}.
							</p>
						) : null}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setConvertRecurringOpen(false)}
							disabled={recurrencePending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={confirmConvertToRecurring}
							disabled={recurrencePending}
						>
							{recurrencePending ? "Convertendo..." : "Converter"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
				/>
			)}
		</>
	);
}
