"use client";

import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PeriodPicker } from "@/components/period-picker";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { groupAndSortCategorias } from "@/lib/lancamentos/categoria-helpers";
import { LANCAMENTO_PAYMENT_METHODS } from "@/lib/lancamentos/constants";
import { getTodayDateString } from "@/lib/utils/date";
import type { SelectOption } from "../../types";
import {
	CategoriaSelectContent,
	ContaCartaoSelectContent,
	PagadorSelectContent,
	PaymentMethodSelectContent,
	TransactionTypeSelectContent,
} from "../select-items";
import { EstabelecimentoInput } from "../shared/estabelecimento-input";

interface MassAddDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: MassAddFormData) => Promise<void>;
	pagadorOptions: SelectOption[];
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	categoriaOptions: SelectOption[];
	estabelecimentos: string[];
	selectedPeriod: string;
	defaultPagadorId?: string | null;
	defaultCartaoId?: string | null;
}

export interface MassAddFormData {
	fixedFields: {
		transactionType?: string;
		paymentMethod?: string;
		condition?: string;
		period?: string;
		contaId?: string;
		cartaoId?: string;
	};
	transactions: Array<{
		purchaseDate: string;
		name: string;
		amount: string;
		categoriaId?: string;
		pagadorId?: string;
	}>;
}

interface TransactionRow {
	id: string;
	purchaseDate: string;
	name: string;
	amount: string;
	categoriaId: string | undefined;
	pagadorId: string | undefined;
}

export function MassAddDialog({
	open,
	onOpenChange,
	onSubmit,
	pagadorOptions,
	contaOptions,
	cartaoOptions,
	categoriaOptions,
	estabelecimentos,
	selectedPeriod,
	defaultPagadorId,
	defaultCartaoId,
}: MassAddDialogProps) {
	const [loading, setLoading] = useState(false);

	// Fixed fields state (sempre ativos, sem checkboxes)
	const [transactionType, setTransactionType] = useState<string>("Despesa");
	const [paymentMethod, setPaymentMethod] = useState<string>(
		LANCAMENTO_PAYMENT_METHODS[0],
	);
	const [period, setPeriod] = useState<string>(selectedPeriod);
	// Formato: "conta:uuid" ou "cartao:uuid"
	const [contaCartaoId, setContaCartaoId] = useState<string | undefined>(
		defaultCartaoId ? `cartao:${defaultCartaoId}` : undefined,
	);

	// Quando defaultCartaoId está definido, exibe apenas o cartão específico
	const isLockedToCartao = !!defaultCartaoId;

	// Deriva contaId e cartaoId do valor selecionado
	const isCartaoSelected = contaCartaoId?.startsWith("cartao:");
	const contaId = contaCartaoId?.startsWith("conta:")
		? contaCartaoId.replace("conta:", "")
		: undefined;
	const cartaoId = contaCartaoId?.startsWith("cartao:")
		? contaCartaoId.replace("cartao:", "")
		: undefined;

	// Transaction rows
	const [transactions, setTransactions] = useState<TransactionRow[]>([
		{
			id: crypto.randomUUID(),
			purchaseDate: getTodayDateString(),
			name: "",
			amount: "",
			categoriaId: undefined,
			pagadorId: defaultPagadorId ?? undefined,
		},
	]);

	// Categorias agrupadas e filtradas por tipo de transação
	const groupedCategorias = useMemo(() => {
		const filtered = categoriaOptions.filter(
			(option) => option.group?.toLowerCase() === transactionType.toLowerCase(),
		);
		return groupAndSortCategorias(filtered);
	}, [categoriaOptions, transactionType]);

	const addTransaction = () => {
		setTransactions([
			...transactions,
			{
				id: crypto.randomUUID(),
				purchaseDate: getTodayDateString(),
				name: "",
				amount: "",
				categoriaId: undefined,
				pagadorId: defaultPagadorId ?? undefined,
			},
		]);
	};

	const removeTransaction = (id: string) => {
		if (transactions.length === 1) {
			toast.error("É necessário ter pelo menos uma transação");
			return;
		}
		setTransactions(transactions.filter((t) => t.id !== id));
	};

	const updateTransaction = (
		id: string,
		field: keyof TransactionRow,
		value: string | undefined,
	) => {
		setTransactions(
			transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
		);
	};

	const handleSubmit = async () => {
		// Validate conta/cartao selection
		if (!contaCartaoId) {
			toast.error("Selecione uma conta ou cartão para continuar");
			return;
		}

		// Validate transactions
		const invalidTransactions = transactions.filter(
			(t) => !t.name.trim() || !t.amount.trim() || !t.purchaseDate,
		);

		if (invalidTransactions.length > 0) {
			toast.error(
				"Preencha todos os campos obrigatórios das transações (data, estabelecimento e valor)",
			);
			return;
		}

		// Build form data
		const formData: MassAddFormData = {
			fixedFields: {
				transactionType,
				paymentMethod: isCartaoSelected ? "Cartão de crédito" : paymentMethod,
				condition: "À vista",
				period,
				contaId: contaId,
				cartaoId: cartaoId,
			},
			transactions: transactions.map((t) => ({
				purchaseDate: t.purchaseDate,
				name: t.name.trim(),
				amount: t.amount.trim(),
				categoriaId: t.categoriaId,
				pagadorId: t.pagadorId,
			})),
		};

		setLoading(true);
		try {
			await onSubmit(formData);
			onOpenChange(false);
			// Reset form
			setTransactionType("Despesa");
			setPaymentMethod(LANCAMENTO_PAYMENT_METHODS[0]);
			setPeriod(selectedPeriod);
			setContaCartaoId(
				defaultCartaoId ? `cartao:${defaultCartaoId}` : undefined,
			);
			setTransactions([
				{
					id: crypto.randomUUID(),
					purchaseDate: getTodayDateString(),
					name: "",
					amount: "",
					categoriaId: undefined,
					pagadorId: defaultPagadorId ?? undefined,
				},
			]);
		} catch (_error) {
			// Error is handled by the onSubmit function
		} finally {
			setLoading(false);
		}
	};

	// Show period picker only for credit card
	const showPeriodPicker = isCartaoSelected;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:px-8">
				<DialogHeader>
					<DialogTitle>Adicionar múltiplos lançamentos</DialogTitle>
					<DialogDescription>
						Configure os valores padrão e adicione várias transações de uma vez.
						Todos os lançamentos adicionados aqui são{" "}
						<span className="font-bold">sempre à vista</span>.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Fixed Fields Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold">Valores Padrão</h3>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{/* Transaction Type */}
							<div className="space-y-2">
								<Label htmlFor="transaction-type">Tipo de Transação</Label>
								<Select
									value={transactionType}
									onValueChange={setTransactionType}
								>
									<SelectTrigger id="transaction-type" className="w-full">
										<SelectValue>
											{transactionType && (
												<TransactionTypeSelectContent label={transactionType} />
											)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Despesa">
											<TransactionTypeSelectContent label="Despesa" />
										</SelectItem>
										<SelectItem value="Receita">
											<TransactionTypeSelectContent label="Receita" />
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Payment Method */}
							<div className="space-y-2">
								<Label htmlFor="payment-method">Forma de Pagamento</Label>
								<Select
									value={paymentMethod}
									onValueChange={(value) => {
										setPaymentMethod(value);
										// Reset conta/cartao when changing payment method
										if (value === "Cartão de crédito") {
											setContaCartaoId(undefined);
										} else {
											setContaCartaoId(undefined);
										}
									}}
								>
									<SelectTrigger id="payment-method" className="w-full">
										<SelectValue>
											{paymentMethod && (
												<PaymentMethodSelectContent label={paymentMethod} />
											)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{LANCAMENTO_PAYMENT_METHODS.map((method) => (
											<SelectItem key={method} value={method}>
												<PaymentMethodSelectContent label={method} />
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Period - only for credit card */}
							{showPeriodPicker ? (
								<div className="space-y-2">
									<Label htmlFor="period">Fatura</Label>
									<PeriodPicker
										value={period}
										onChange={setPeriod}
										className="w-full truncate"
									/>
								</div>
							) : null}

							{/* Conta/Cartao */}
							<div className="space-y-2">
								<Label htmlFor="conta-cartao">
									{isLockedToCartao ? "Cartão" : "Conta/Cartão"}
								</Label>
								<Select
									value={contaCartaoId}
									onValueChange={setContaCartaoId}
									disabled={isLockedToCartao}
								>
									<SelectTrigger id="conta-cartao" className="w-full">
										<SelectValue placeholder="Selecione">
											{contaCartaoId &&
												(() => {
													if (isCartaoSelected) {
														const selectedOption = cartaoOptions.find(
															(opt) => opt.value === cartaoId,
														);
														return selectedOption ? (
															<ContaCartaoSelectContent
																label={selectedOption.label}
																logo={selectedOption.logo}
																isCartao={true}
															/>
														) : null;
													} else {
														const selectedOption = contaOptions.find(
															(opt) => opt.value === contaId,
														);
														return selectedOption ? (
															<ContaCartaoSelectContent
																label={selectedOption.label}
																logo={selectedOption.logo}
																isCartao={false}
															/>
														) : null;
													}
												})()}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{cartaoOptions.length > 0 && (
											<SelectGroup>
												{!isLockedToCartao && (
													<SelectLabel>Cartões</SelectLabel>
												)}
												{cartaoOptions
													.filter(
														(option) =>
															!isLockedToCartao ||
															option.value === defaultCartaoId,
													)
													.map((option) => (
														<SelectItem
															key={option.value}
															value={`cartao:${option.value}`}
														>
															<ContaCartaoSelectContent
																label={option.label}
																logo={option.logo}
																isCartao={true}
															/>
														</SelectItem>
													))}
											</SelectGroup>
										)}
										{!isLockedToCartao && contaOptions.length > 0 && (
											<SelectGroup>
												<SelectLabel>Contas</SelectLabel>
												{contaOptions.map((option) => (
													<SelectItem
														key={option.value}
														value={`conta:${option.value}`}
													>
														<ContaCartaoSelectContent
															label={option.label}
															logo={option.logo}
															isCartao={false}
														/>
													</SelectItem>
												))}
											</SelectGroup>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<Separator />

					{/* Transactions Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold">Lançamentos</h3>

						<div className="space-y-3">
							{transactions.map((transaction, index) => (
								<div
									key={transaction.id}
									className="grid gap-2 border-b pb-3 border-dashed last:border-0"
								>
									<div className="flex gap-2 w-full">
										<div className="w-full">
											<Label
												htmlFor={`date-${transaction.id}`}
												className="sr-only"
											>
												Data {index + 1}
											</Label>
											<DatePicker
												id={`date-${transaction.id}`}
												value={transaction.purchaseDate}
												onChange={(value) =>
													updateTransaction(
														transaction.id,
														"purchaseDate",
														value,
													)
												}
												placeholder="Data"
												className="w-32 truncate"
												required
											/>
										</div>
										<div className="w-full">
											<Label
												htmlFor={`name-${transaction.id}`}
												className="sr-only"
											>
												Estabelecimento {index + 1}
											</Label>
											<EstabelecimentoInput
												id={`name-${transaction.id}`}
												placeholder="Local"
												value={transaction.name}
												onChange={(value) =>
													updateTransaction(transaction.id, "name", value)
												}
												estabelecimentos={estabelecimentos}
												required
											/>
										</div>

										<div className="w-full">
											<Label
												htmlFor={`amount-${transaction.id}`}
												className="sr-only"
											>
												Valor {index + 1}
											</Label>
											<CurrencyInput
												id={`amount-${transaction.id}`}
												placeholder="R$ 0,00"
												value={transaction.amount}
												onValueChange={(value) =>
													updateTransaction(transaction.id, "amount", value)
												}
												required
											/>
										</div>

										<div className="w-full">
											<Label
												htmlFor={`pagador-${transaction.id}`}
												className="sr-only"
											>
												Pagador {index + 1}
											</Label>
											<Select
												value={transaction.pagadorId}
												onValueChange={(value) =>
													updateTransaction(transaction.id, "pagadorId", value)
												}
											>
												<SelectTrigger
													id={`pagador-${transaction.id}`}
													className="w-32 truncate"
												>
													<SelectValue placeholder="Pagador">
														{transaction.pagadorId &&
															(() => {
																const selectedOption = pagadorOptions.find(
																	(opt) => opt.value === transaction.pagadorId,
																);
																return selectedOption ? (
																	<PagadorSelectContent
																		label={selectedOption.label}
																		avatarUrl={selectedOption.avatarUrl}
																	/>
																) : null;
															})()}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{pagadorOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<PagadorSelectContent
																label={option.label}
																avatarUrl={option.avatarUrl}
															/>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="w-full">
											<Label
												htmlFor={`categoria-${transaction.id}`}
												className="sr-only"
											>
												Categoria {index + 1}
											</Label>
											<Select
												value={transaction.categoriaId}
												onValueChange={(value) =>
													updateTransaction(
														transaction.id,
														"categoriaId",
														value,
													)
												}
											>
												<SelectTrigger
													id={`categoria-${transaction.id}`}
													className="w-32 truncate"
												>
													<SelectValue placeholder="Categoria" />
												</SelectTrigger>
												<SelectContent>
													{groupedCategorias.map((group) => (
														<SelectGroup key={group.label}>
															<SelectLabel>{group.label}</SelectLabel>
															{group.options.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	<CategoriaSelectContent
																		label={option.label}
																		icon={option.icon}
																	/>
																</SelectItem>
															))}
														</SelectGroup>
													))}
												</SelectContent>
											</Select>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-7 shrink-0"
											onClick={addTransaction}
										>
											<RiAddLine className="size-3.5" />
											<span className="sr-only">Adicionar transação</span>
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-7 shrink-0"
											onClick={() => removeTransaction(transaction.id)}
											disabled={transactions.length === 1}
										>
											<RiDeleteBinLine className="size-3.5" />
											<span className="sr-only">Remover transação</span>
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading && <Spinner className="size-4" />}
						Criar {transactions.length}{" "}
						{transactions.length === 1 ? "lançamento" : "lançamentos"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
