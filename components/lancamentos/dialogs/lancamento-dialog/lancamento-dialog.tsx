"use client";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	checkFaturaStatusAction,
	createLancamentoAction,
	updateLancamentoAction,
} from "@/app/(dashboard)/lancamentos/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useControlledState } from "@/hooks/use-controlled-state";
import {
	filterSecondaryPagadorOptions,
	groupAndSortCategorias,
} from "@/lib/lancamentos/categoria-helpers";
import {
	applyFieldDependencies,
	buildLancamentoInitialState,
} from "@/lib/lancamentos/form-helpers";
import {
	type FaturaWarning,
	FaturaWarningDialog,
} from "../fatura-warning-dialog";
import { BasicFieldsSection } from "./basic-fields-section";
import { BoletoFieldsSection } from "./boleto-fields-section";
import { CategorySection } from "./category-section";
import { ConditionSection } from "./condition-section";
import type {
	FormState,
	LancamentoDialogProps,
} from "./lancamento-dialog-types";
import { NoteSection } from "./note-section";
import { PagadorSection } from "./pagador-section";
import { PaymentMethodSection } from "./payment-method-section";
import { SplitAndSettlementSection } from "./split-settlement-section";

export function LancamentoDialog({
	mode,
	trigger,
	open,
	onOpenChange,
	pagadorOptions,
	splitPagadorOptions,
	defaultPagadorId,
	contaOptions,
	cartaoOptions,
	categoriaOptions,
	estabelecimentos,
	lancamento,
	defaultPeriod,
	defaultCartaoId,
	defaultPaymentMethod,
	defaultPurchaseDate,
	defaultName,
	defaultAmount,
	lockCartaoSelection,
	lockPaymentMethod,
	isImporting = false,
	defaultTransactionType,
	forceShowTransactionType = false,
	onSuccess,
	onBulkEditRequest,
}: LancamentoDialogProps) {
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const [formState, setFormState] = useState<FormState>(() =>
		buildLancamentoInitialState(lancamento, defaultPagadorId, defaultPeriod, {
			defaultCartaoId,
			defaultPaymentMethod,
			defaultPurchaseDate,
			defaultName,
			defaultAmount,
			defaultTransactionType,
			isImporting,
		}),
	);
	const [periodDirty, setPeriodDirty] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [faturaWarning, setFaturaWarning] = useState<FaturaWarning | null>(
		null,
	);
	const lastCheckedRef = useRef<string | null>(null);

	useEffect(() => {
		if (dialogOpen) {
			setFormState(
				buildLancamentoInitialState(
					lancamento,
					defaultPagadorId,
					defaultPeriod,
					{
						defaultCartaoId,
						defaultPaymentMethod,
						defaultPurchaseDate,
						defaultName,
						defaultAmount,
						defaultTransactionType,
						isImporting,
					},
				),
			);
			setErrorMessage(null);
			setPeriodDirty(false);
			setFaturaWarning(null);
			lastCheckedRef.current = null;
		} else {
			setFaturaWarning(null);
		}
	}, [
		dialogOpen,
		lancamento,
		defaultPagadorId,
		defaultPeriod,
		defaultCartaoId,
		defaultPaymentMethod,
		defaultPurchaseDate,
		defaultName,
		defaultAmount,
		defaultTransactionType,
		isImporting,
	]);

	useEffect(() => {
		if (mode !== "create") return;
		if (!dialogOpen) return;
		if (formState.paymentMethod !== "Cartão de crédito") return;
		if (!formState.cartaoId) return;

		const checkKey = `${formState.cartaoId}:${formState.period}`;
		if (checkKey === lastCheckedRef.current) return;
		lastCheckedRef.current = checkKey;

		checkFaturaStatusAction(formState.cartaoId, formState.period).then(
			(result) => {
				if (result?.shouldSuggestNext) {
					setFaturaWarning({
						nextPeriod: result.nextPeriod,
						cardName: result.cardName,
						isPaid: result.isPaid,
						isAfterClosing: result.isAfterClosing,
						closingDay: result.closingDay,
						currentPeriod: formState.period,
					});
				} else {
					setFaturaWarning(null);
				}
			},
		);
	}, [
		mode,
		dialogOpen,
		formState.paymentMethod,
		formState.cartaoId,
		formState.period,
	]);

	const primaryPagador = formState.pagadorId;

	const secondaryPagadorOptions = useMemo(
		() => filterSecondaryPagadorOptions(splitPagadorOptions, primaryPagador),
		[splitPagadorOptions, primaryPagador],
	);

	const categoriaGroups = useMemo(() => {
		const filtered = categoriaOptions.filter(
			(option) =>
				option.group?.toLowerCase() === formState.transactionType.toLowerCase(),
		);
		return groupAndSortCategorias(filtered);
	}, [categoriaOptions, formState.transactionType]);

	const totalAmount = useMemo(() => {
		const parsed = Number.parseFloat(formState.amount);
		return Number.isNaN(parsed) ? 0 : Math.abs(parsed);
	}, [formState.amount]);

	const handleFieldChange = useCallback(
		<Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
			if (key === "period") {
				setPeriodDirty(true);
			}

			setFormState((prev) => {
				const dependencies = applyFieldDependencies(
					key,
					value,
					prev,
					periodDirty,
				);

				return {
					...prev,
					[key]: value,
					...dependencies,
				};
			});
		},
		[periodDirty],
	);

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
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

			if (formState.isSplit && !formState.pagadorId) {
				const message =
					"Selecione o pagador principal para dividir o lançamento.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			if (formState.isSplit && !formState.secondaryPagadorId) {
				const message =
					"Selecione o pagador secundário para dividir o lançamento.";
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

			if (!formState.categoriaId) {
				const message = "Selecione uma categoria.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			if (formState.paymentMethod === "Cartão de crédito") {
				if (!formState.cartaoId) {
					const message = "Selecione o cartão.";
					setErrorMessage(message);
					toast.error(message);
					return;
				}
			} else if (!formState.contaId) {
				const message = "Selecione a conta.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			const payload = {
				purchaseDate: formState.purchaseDate,
				period: formState.period,
				name: formState.name.trim(),
				transactionType: formState.transactionType,
				amount: sanitizedAmount,
				condition: formState.condition,
				paymentMethod: formState.paymentMethod,
				pagadorId: formState.pagadorId,
				secondaryPagadorId: formState.isSplit
					? formState.secondaryPagadorId
					: undefined,
				isSplit: formState.isSplit,
				primarySplitAmount: formState.isSplit
					? Number.parseFloat(formState.primarySplitAmount) || undefined
					: undefined,
				secondarySplitAmount: formState.isSplit
					? Number.parseFloat(formState.secondarySplitAmount) || undefined
					: undefined,
				contaId: formState.contaId,
				cartaoId: formState.cartaoId,
				categoriaId: formState.categoriaId,
				note: formState.note.trim() || undefined,
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
					const result = await createLancamentoAction(payload);

					if (result.success) {
						toast.success(result.message);
						onSuccess?.();
						setDialogOpen(false);
						return;
					}

					setErrorMessage(result.error);
					toast.error(result.error);
					return;
				}

				// Update mode
				const hasSeriesId = Boolean(lancamento?.seriesId);

				if (hasSeriesId && onBulkEditRequest) {
					// Para lançamentos em série, abre o diálogo de bulk action
					onBulkEditRequest({
						id: lancamento?.id ?? "",
						name: formState.name.trim(),
						categoriaId: formState.categoriaId,
						note: formState.note.trim() || "",
						pagadorId: formState.pagadorId,
						contaId: formState.contaId,
						cartaoId: formState.cartaoId,
						amount: sanitizedAmount,
						dueDate:
							formState.paymentMethod === "Boleto"
								? formState.dueDate || null
								: null,
						boletoPaymentDate:
							mode === "update" && formState.paymentMethod === "Boleto"
								? formState.boletoPaymentDate || null
								: null,
					});
					return;
				}

				// Atualização normal para lançamentos únicos ou todos os campos
				const result = await updateLancamentoAction({
					id: lancamento?.id ?? "",
					...payload,
				});

				if (result.success) {
					toast.success(result.message);
					onSuccess?.();
					setDialogOpen(false);
					return;
				}

				setErrorMessage(result.error);
				toast.error(result.error);
			});
		},
		[
			formState,
			mode,
			lancamento?.id,
			lancamento?.seriesId,
			setDialogOpen,
			onSuccess,
			onBulkEditRequest,
		],
	);

	const isCopyMode = mode === "create" && Boolean(lancamento) && !isImporting;
	const isImportMode = mode === "create" && Boolean(lancamento) && isImporting;
	const isNewWithType =
		mode === "create" && !lancamento && defaultTransactionType;

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
				? "Importando lançamento de outro usuário. Ajuste a categoria, pagador e cartão/conta antes de salvar."
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
	const disableCartaoSelect = Boolean(lockCartaoSelection && mode === "create");

	return (
		<>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
				<DialogContent className="sm:max-w-xl p-6 sm:px-8">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					<form
						className="space-y-2 -mx-6 max-h-[80vh] overflow-y-auto px-6 pb-1"
						onSubmit={handleSubmit}
						noValidate
					>
						<BasicFieldsSection
							formState={formState}
							onFieldChange={handleFieldChange}
							estabelecimentos={estabelecimentos}
						/>

						<CategorySection
							formState={formState}
							onFieldChange={handleFieldChange}
							categoriaOptions={categoriaOptions}
							categoriaGroups={categoriaGroups}
							isUpdateMode={isUpdateMode}
							hideTransactionType={
								Boolean(isNewWithType) && !forceShowTransactionType
							}
						/>

						{!isUpdateMode ? (
							<SplitAndSettlementSection
								formState={formState}
								onFieldChange={handleFieldChange}
								showSettledToggle={showSettledToggle}
							/>
						) : null}

						<PagadorSection
							formState={formState}
							onFieldChange={handleFieldChange}
							pagadorOptions={pagadorOptions}
							secondaryPagadorOptions={secondaryPagadorOptions}
							totalAmount={totalAmount}
						/>

						<PaymentMethodSection
							formState={formState}
							onFieldChange={handleFieldChange}
							contaOptions={contaOptions}
							cartaoOptions={cartaoOptions}
							isUpdateMode={isUpdateMode}
							disablePaymentMethod={disablePaymentMethod}
							disableCartaoSelect={disableCartaoSelect}
						/>

						{showDueDate ? (
							<BoletoFieldsSection
								formState={formState}
								onFieldChange={handleFieldChange}
								showPaymentDate={showPaymentDate}
							/>
						) : null}

						{!isUpdateMode ? (
							<ConditionSection
								formState={formState}
								onFieldChange={handleFieldChange}
								showInstallments={showInstallments}
								showRecurrence={showRecurrence}
							/>
						) : null}

						<NoteSection
							formState={formState}
							onFieldChange={handleFieldChange}
						/>

						{errorMessage ? (
							<p className="text-sm text-destructive">{errorMessage}</p>
						) : null}

						<DialogFooter className="gap-3">
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

			<FaturaWarningDialog
				warning={faturaWarning}
				onConfirm={(nextPeriod) => {
					handleFieldChange("period", nextPeriod);
					setFaturaWarning(null);
				}}
				onCancel={() => setFaturaWarning(null)}
			/>
		</>
	);
}
