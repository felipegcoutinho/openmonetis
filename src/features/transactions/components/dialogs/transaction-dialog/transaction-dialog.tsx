"use client";
import { RiArrowDropDownLine } from "@remixicon/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createTransactionAction,
	updateTransactionAction,
} from "@/features/transactions/actions";
import {
	confirmAttachmentUploadAction,
	detachTransactionAttachmentAction,
	getPresignedUploadUrlAction,
} from "@/features/transactions/actions/attachments";
import {
	filterSecondaryPayerOptions,
	groupAndSortCategories,
} from "@/features/transactions/category-helpers";
import {
	applyFieldDependencies,
	buildTransactionInitialState,
	deriveCreditCardPeriod,
} from "@/features/transactions/form-helpers";
import { Button } from "@/shared/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { AttachmentFilePicker } from "../../attachments/attachment-file-picker";
import { AttachmentSection } from "../../attachments/attachment-section";
import { BasicFieldsSection } from "./basic-fields-section";
import { BoletoFieldsSection } from "./boleto-fields-section";
import { CategorySection } from "./category-section";
import { ConditionSection } from "./condition-section";
import { NoteSection } from "./note-section";
import { PayerSection } from "./payer-section";
import { PaymentMethodSection } from "./payment-method-section";
import type {
	FormState,
	TransactionDialogProps,
} from "./transaction-dialog-types";

export function TransactionDialog({
	mode,
	trigger,
	open,
	onOpenChange,
	payerOptions,
	splitPayerOptions,
	defaultPayerId,
	accountOptions,
	cardOptions,
	categoryOptions,
	estabelecimentos,
	transaction,
	defaultPeriod,
	defaultCardId,
	defaultPaymentMethod,
	defaultPurchaseDate,
	defaultName,
	defaultAmount,
	lockCardSelection,
	lockPaymentMethod,
	isImporting,
	defaultTransactionType,
	forceShowTransactionType,
	onSuccess,
	maxSizeMb,
	onBulkEditRequest,
}: TransactionDialogProps) {
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const [formState, setFormState] = useState<FormState>(() =>
		buildTransactionInitialState(transaction, defaultPayerId, defaultPeriod, {
			defaultCardId,
			defaultPaymentMethod,
			defaultPurchaseDate,
			defaultName,
			defaultAmount,
			defaultTransactionType,
			isImporting,
		}),
	);
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const [pendingDetachIds, setPendingDetachIds] = useState<string[]>([]);
	const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);

	useEffect(() => {
		if (dialogOpen) {
			const initial = buildTransactionInitialState(
				transaction,
				defaultPayerId,
				defaultPeriod,
				{
					defaultCardId,
					defaultPaymentMethod,
					defaultPurchaseDate,
					defaultName,
					defaultAmount,
					defaultTransactionType,
					isImporting,
				},
			);

			// Derive credit card period on open when cardId is pre-filled (create only)
			if (
				mode !== "update" &&
				initial.paymentMethod === "Cartão de crédito" &&
				initial.cardId &&
				initial.purchaseDate
			) {
				const card = cardOptions.find((opt) => opt.value === initial.cardId);
				if (card?.closingDay) {
					initial.period = deriveCreditCardPeriod(
						initial.purchaseDate,
						card.closingDay,
						card.dueDay,
					);
				}
			}

			setFormState(initial);
			setErrorMessage(null);
			setPendingFiles([]);
			setPendingDetachIds([]);
			setPendingUploadFiles([]);
		}
	}, [
		dialogOpen,
		transaction,
		defaultPayerId,
		defaultPeriod,
		defaultCardId,
		defaultPaymentMethod,
		defaultPurchaseDate,
		defaultName,
		defaultAmount,
		defaultTransactionType,
		isImporting,
		cardOptions,
		mode,
	]);

	const primaryPayerId = formState.payerId;

	const secondaryPayerOptions = useMemo(
		() => filterSecondaryPayerOptions(splitPayerOptions, primaryPayerId),
		[splitPayerOptions, primaryPayerId],
	);

	const categoryGroups = useMemo(() => {
		const filtered = categoryOptions.filter(
			(option) =>
				option.group?.toLowerCase() === formState.transactionType.toLowerCase(),
		);
		return groupAndSortCategories(filtered);
	}, [categoryOptions, formState.transactionType]);

	type CreateTransactionInput = Parameters<typeof createTransactionAction>[0];
	type UpdateTransactionInput = Parameters<typeof updateTransactionAction>[0];

	const totalAmount = useMemo(() => {
		const parsed = Number.parseFloat(formState.amount);
		return Number.isNaN(parsed) ? 0 : Math.abs(parsed);
	}, [formState.amount]);

	function getCardInfo(cardId: string | undefined) {
		if (!cardId) return null;
		const card = cardOptions.find((opt) => opt.value === cardId);
		if (!card) return null;
		return {
			closingDay: card.closingDay ?? null,
			dueDay: card.dueDay ?? null,
		};
	}

	function handleFieldChange<Key extends keyof FormState>(
		key: Key,
		value: FormState[Key],
	) {
		setFormState((prev) => {
			const effectiveCardId =
				key === "cardId" ? (value as string) : prev.cardId;
			const cardInfo = getCardInfo(effectiveCardId);

			const dependencies = applyFieldDependencies(key, value, prev, cardInfo);

			return {
				...prev,
				[key]: value,
				...dependencies,
			};
		});
	}

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);

		if (!formState.purchaseDate) {
			const message = "Informe a data da transação.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (!formState.name.trim()) {
			const message = "Informe a descrição do lançamento.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.isSplit && !formState.payerId) {
			const message =
				"Selecione a pessoa principal para dividir o lançamento.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.isSplit && !formState.secondaryPayerId) {
			const message =
				"Selecione a pessoa secundário para dividir o lançamento.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const amountValue = Number(formState.amount);
		if (Number.isNaN(amountValue)) {
			const message = "Informe um valor válido.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const sanitizedAmount = Math.abs(amountValue);

		if (!formState.categoryId) {
			const message = "Selecione uma categoria.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (formState.paymentMethod === "Cartão de crédito") {
			if (!formState.cardId) {
				const message = "Selecione o cartão.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}
		} else if (!formState.accountId) {
			const message = "Selecione a conta.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const payload: CreateTransactionInput = {
			purchaseDate: formState.purchaseDate,
			period: formState.period,
			name: formState.name.trim(),
			transactionType:
				formState.transactionType as CreateTransactionInput["transactionType"],
			amount: sanitizedAmount,
			condition: formState.condition as CreateTransactionInput["condition"],
			paymentMethod:
				formState.paymentMethod as CreateTransactionInput["paymentMethod"],
			payerId: formState.payerId ?? null,
			secondaryPayerId: formState.isSplit
				? formState.secondaryPayerId
				: undefined,
			isSplit: formState.isSplit,
			primarySplitAmount: formState.isSplit
				? Number.parseFloat(formState.primarySplitAmount) || undefined
				: undefined,
			secondarySplitAmount: formState.isSplit
				? Number.parseFloat(formState.secondarySplitAmount) || undefined
				: undefined,
			accountId: formState.accountId ?? null,
			cardId: formState.cardId ?? null,
			categoryId: formState.categoryId ?? null,
			note: formState.note.trim() || null,
			isSettled:
				formState.paymentMethod === "Cartão de crédito"
					? null
					: Boolean(formState.isSettled),
			installmentCount:
				formState.condition === "Parcelado" && formState.installmentCount
					? Number(formState.installmentCount)
					: undefined,
			recurrenceCount:
				formState.condition === "Recorrente" && formState.recurrenceCount
					? Number(formState.recurrenceCount)
					: undefined,
			dueDate:
				formState.paymentMethod === "Boleto" && formState.dueDate
					? formState.dueDate
					: undefined,
			boletoPaymentDate:
				mode === "update" &&
				formState.paymentMethod === "Boleto" &&
				formState.boletoPaymentDate
					? formState.boletoPaymentDate
					: undefined,
		};

		startTransition(async () => {
			if (mode === "create") {
				const result = await createTransactionAction(payload);

				if (result.success) {
					if (pendingFiles.length > 0 && result.data?.ids?.length) {
						const firstId = result.data.ids[0];
						const isNewSeries =
							formState.condition === "Parcelado" ||
							formState.condition === "Recorrente";
						for (const file of pendingFiles) {
							const presign = await getPresignedUploadUrlAction({
								fileName: file.name,
								mimeType: file.type,
								fileSize: file.size,
								transactionId: firstId,
							});
							if (presign.success) {
								await fetch(presign.presignedUrl, {
									method: "PUT",
									body: file,
									headers: { "Content-Type": file.type },
								});
								await confirmAttachmentUploadAction({
									uploadToken: presign.uploadToken,
									scope: isNewSeries ? "all" : "current",
								});
							}
						}
					}
					toast.success(result.message);
					onSuccess?.();
					setDialogOpen(false);
					return;
				}

				setErrorMessage(result.error);
				toast.error(result.error);
				return;
			}

			const hasSeriesId = Boolean(transaction?.seriesId);

			if (hasSeriesId && onBulkEditRequest) {
				// Para lançamentos em série, passa os arquivos para a página confirmar
				// o upload após o escopo ser escolhido (sem upload antecipado ao S3)
				onBulkEditRequest({
					id: transaction?.id ?? "",
					purchaseDate: formState.purchaseDate,
					period: formState.period,
					name: formState.name.trim(),
					categoryId: formState.categoryId,
					note: formState.note.trim() || "",
					payerId: formState.payerId,
					accountId: formState.accountId,
					cardId: formState.cardId,
					amount: sanitizedAmount,
					dueDate:
						formState.paymentMethod === "Boleto"
							? formState.dueDate || null
							: null,
					boletoPaymentDate:
						mode === "update" && formState.paymentMethod === "Boleto"
							? formState.boletoPaymentDate || null
							: null,
					isSettled:
						formState.paymentMethod === "Cartão de crédito"
							? null
							: Boolean(formState.isSettled),
					pendingDetachIds,
					pendingUploadFiles,
				});
				return;
			}

			// Atualização normal para lançamentos únicos
			const updatePayload: UpdateTransactionInput = {
				id: transaction?.id ?? "",
				...payload,
			};

			const result = await updateTransactionAction(updatePayload);

			if (result.success) {
				for (const attachmentId of pendingDetachIds) {
					await detachTransactionAttachmentAction({
						attachmentId,
						transactionId: transaction?.id ?? "",
					});
				}
				for (const file of pendingUploadFiles) {
					const presign = await getPresignedUploadUrlAction({
						fileName: file.name,
						mimeType: file.type,
						fileSize: file.size,
						transactionId: transaction?.id ?? "",
					});
					if (presign.success) {
						await fetch(presign.presignedUrl, {
							method: "PUT",
							body: file,
							headers: { "Content-Type": file.type },
						});
						await confirmAttachmentUploadAction({
							uploadToken: presign.uploadToken,
							scope: "current",
						});
					}
				}
				toast.success(result.message);
				onSuccess?.();
				setDialogOpen(false);
				return;
			}

			setErrorMessage(result.error);
			toast.error(result.error);
		});
	};

	const isCopyMode = mode === "create" && Boolean(transaction) && !isImporting;
	const isImportMode = mode === "create" && Boolean(transaction) && isImporting;
	const isNewWithType =
		mode === "create" && !transaction && defaultTransactionType;

	const title =
		mode === "create"
			? isImportMode
				? "Importar para Minha Conta"
				: isCopyMode
					? "Copiar lançamento"
					: isNewWithType
						? defaultTransactionType === "Despesa"
							? "Nova Despesa"
							: "Nova Receita"
						: "Novo lançamento"
			: "Editar lançamento";
	const description =
		mode === "create"
			? isImportMode
				? "Importando lançamento de outro usuário. Ajuste a categoria, pessoa e cartão/conta antes de salvar."
				: isCopyMode
					? "Os dados do lançamento foram copiados. Revise e ajuste conforme necessário antes de salvar."
					: isNewWithType
						? `Informe os dados abaixo para registrar ${defaultTransactionType === "Despesa" ? "uma nova despesa" : "uma nova receita"}.`
						: "Informe os dados abaixo para registrar um novo lançamento."
			: "Atualize as informações do lançamento selecionado.";
	const submitLabel = mode === "create" ? "Salvar lançamento" : "Atualizar";

	const showInstallments = formState.condition === "Parcelado";
	const showRecurrence = formState.condition === "Recorrente";
	const showDueDate = formState.paymentMethod === "Boleto";
	const showPaymentDate = mode === "update" && showDueDate;
	const showSettledToggle = formState.paymentMethod !== "Cartão de crédito";
	const isUpdateMode = mode === "update";
	const disablePaymentMethod = Boolean(lockPaymentMethod && mode === "create");
	const disableCardSelect = Boolean(lockCardSelection && mode === "create");

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="min-w-0 overflow-x-hidden">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form
					className="flex min-w-0 flex-col gap-0"
					onSubmit={handleSubmit}
					noValidate
				>
					<div className="min-w-0 -mx-6 max-h-[90vh] overflow-x-hidden overflow-y-auto px-6 pb-1">
						{/* Detalhes */}
						<div className="space-y-3">
							<BasicFieldsSection
								formState={formState}
								onFieldChange={handleFieldChange}
								estabelecimentos={estabelecimentos}
							/>

							<CategorySection
								formState={formState}
								onFieldChange={handleFieldChange}
								categoryOptions={categoryOptions}
								categoryGroups={categoryGroups}
								isUpdateMode={isUpdateMode}
								hideTransactionType={
									Boolean(isNewWithType) && !forceShowTransactionType
								}
							/>
						</div>

						<div className="border-t border-border/40 my-3" />

						{/* Pessoa */}
						<PayerSection
							formState={formState}
							onFieldChange={handleFieldChange}
							payerOptions={payerOptions}
							secondaryPayerOptions={secondaryPayerOptions}
							totalAmount={totalAmount}
						/>

						<div className="border-t border-border/40 my-3" />

						{/* Pagamento */}
						<div className="space-y-3">
							<PaymentMethodSection
								formState={formState}
								onFieldChange={handleFieldChange}
								accountOptions={accountOptions}
								cardOptions={cardOptions}
								isUpdateMode={isUpdateMode}
								disablePaymentMethod={disablePaymentMethod}
								disableCardSelect={disableCardSelect}
								showSettledToggle={showSettledToggle}
							/>

							{showDueDate ? (
								<BoletoFieldsSection
									formState={formState}
									onFieldChange={handleFieldChange}
									showPaymentDate={showPaymentDate}
								/>
							) : null}
						</div>

						{/* Extras */}
						{isUpdateMode ? (
							<>
								<div className="border-t border-border/40 my-3" />
								<div className="space-y-3">
									<NoteSection
										formState={formState}
										onFieldChange={handleFieldChange}
									/>
									<div className="space-y-2">
										<Label className="text-xs font-medium leading-none">
											Anexos
										</Label>
										<AttachmentSection
											transactionId={transaction?.id ?? ""}
											maxSizeMb={maxSizeMb}
											pendingDetachIds={pendingDetachIds}
											onPendingDetach={(id) =>
												setPendingDetachIds((prev) => [...prev, id])
											}
											onUndoPendingDetach={(id) =>
												setPendingDetachIds((prev) =>
													prev.filter((x) => x !== id),
												)
											}
											pendingUploadFiles={pendingUploadFiles}
											onPendingUpload={(file) =>
												setPendingUploadFiles((prev) => [...prev, file])
											}
											onCancelPendingUpload={(file) =>
												setPendingUploadFiles((prev) =>
													prev.filter((f) => f !== file),
												)
											}
										/>
									</div>
								</div>
							</>
						) : (
							<Collapsible
								defaultOpen={formState.condition !== "À vista"}
								className="min-w-0"
							>
								<CollapsibleTrigger className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer [&[data-state=open]>svg]:rotate-180 mt-4">
									<RiArrowDropDownLine className="text-primary size-4 transition-transform duration-200" />
									Condições, anotações e anexos
								</CollapsibleTrigger>
								<CollapsibleContent className="min-w-0 overflow-hidden space-y-3 pt-3">
									<ConditionSection
										formState={formState}
										onFieldChange={handleFieldChange}
										showInstallments={showInstallments}
										showRecurrence={showRecurrence}
									/>
									<NoteSection
										formState={formState}
										onFieldChange={handleFieldChange}
									/>
									<AttachmentFilePicker
										files={pendingFiles}
										onAdd={(file) => setPendingFiles((prev) => [...prev, file])}
										onRemove={(file) =>
											setPendingFiles((prev) => prev.filter((f) => f !== file))
										}
										maxSizeMb={maxSizeMb}
									/>
								</CollapsibleContent>
							</Collapsible>
						)}
					</div>

					{errorMessage ? (
						<p className="mt-3 text-sm text-destructive">{errorMessage}</p>
					) : null}

					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Salvando..." : submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
