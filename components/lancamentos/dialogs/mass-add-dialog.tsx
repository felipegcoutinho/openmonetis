"use client";

import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { MonthPicker } from "@/components/ui/monthpicker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { displayPeriod } from "@/lib/utils/period";
import type { SelectOption } from "../../types";
import {
	CategoriaSelectContent,
	ContaCartaoSelectContent,
	PagadorSelectContent,
	PaymentMethodSelectContent,
	TransactionTypeSelectContent,
} from "../select-items";
import { EstabelecimentoInput } from "../shared/estabelecimento-input";

/** Payment methods sem Boleto para este modal */
const MASS_ADD_PAYMENT_METHODS = LANCAMENTO_PAYMENT_METHODS.filter(
	(m) => m !== "Boleto",
);

function periodToDate(period: string): Date {
	const [year, month] = period.split("-").map(Number);
	return new Date(year, month - 1, 1);
}

function dateToPeriod(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

function InlinePeriodPicker({
	period,
	onPeriodChange,
}: {
	period: string;
	onPeriodChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div className="-mt-1">
			<span className="text-xs text-muted-foreground">Fatura de </span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="text-xs text-primary underline-offset-2 hover:underline cursor-pointer lowercase"
					>
						{displayPeriod(period)}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<MonthPicker
						selectedMonth={periodToDate(period)}
						onMonthSelect={(date) => {
							onPeriodChange(dateToPeriod(date));
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

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
	const [contaId, setContaId] = useState<string | undefined>(undefined);
	const [cartaoId, setCartaoId] = useState<string | undefined>(
		defaultCartaoId ?? undefined,
	);

	// Quando defaultCartaoId está definido, exibe apenas o cartão específico
	const isLockedToCartao = !!defaultCartaoId;

	const isCartaoSelected = paymentMethod === "Cartão de crédito";

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
		if (isCartaoSelected && !cartaoId) {
			toast.error("Selecione um cartão para continuar");
			return;
		}
		if (!isCartaoSelected && !contaId) {
			toast.error("Selecione uma conta para continuar");
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
				paymentMethod,
				condition: "À vista",
				period,
				contaId,
				cartaoId,
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
			setContaId(undefined);
			setCartaoId(defaultCartaoId ?? undefined);
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

				<div className="space-y-4">
					{/* Fixed Fields Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold">Valores Padrão</h3>
						<div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
											setContaId(undefined);
										} else {
											setCartaoId(undefined);
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
										{MASS_ADD_PAYMENT_METHODS.map((method) => (
											<SelectItem key={method} value={method}>
												<PaymentMethodSelectContent label={method} />
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Cartão (only for credit card) */}
							{isCartaoSelected ? (
								<div className="space-y-2">
									<Label htmlFor="cartao">Cartão</Label>
									<Select
										value={cartaoId}
										onValueChange={setCartaoId}
										disabled={isLockedToCartao}
									>
										<SelectTrigger id="cartao" className="w-full">
											<SelectValue placeholder="Selecione">
												{cartaoId &&
													(() => {
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
													})()}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{cartaoOptions.length === 0 ? (
												<div className="px-2 py-6 text-center">
													<p className="text-sm text-muted-foreground">
														Nenhum cartão cadastrado
													</p>
												</div>
											) : (
												cartaoOptions
													.filter(
														(option) =>
															!isLockedToCartao ||
															option.value === defaultCartaoId,
													)
													.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<ContaCartaoSelectContent
																label={option.label}
																logo={option.logo}
																isCartao={true}
															/>
														</SelectItem>
													))
											)}
										</SelectContent>
									</Select>
									{cartaoId ? (
										<InlinePeriodPicker
											period={period}
											onPeriodChange={setPeriod}
										/>
									) : null}
								</div>
							) : null}

							{/* Conta (for non-credit-card methods) */}
							{!isCartaoSelected ? (
								<div className="space-y-2">
									<Label htmlFor="conta">Conta</Label>
									<Select value={contaId} onValueChange={setContaId}>
										<SelectTrigger id="conta" className="w-full">
											<SelectValue placeholder="Selecione">
												{contaId &&
													(() => {
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
													})()}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{contaOptions.length === 0 ? (
												<div className="px-2 py-6 text-center">
													<p className="text-sm text-muted-foreground">
														Nenhuma conta cadastrada
													</p>
												</div>
											) : (
												contaOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														<ContaCartaoSelectContent
															label={option.label}
															logo={option.logo}
															isCartao={false}
														/>
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								</div>
							) : null}
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
										<div className="w-24 shrink-0">
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
												compact
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
