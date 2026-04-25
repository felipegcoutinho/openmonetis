"use client";

import {
	RiCheckLine,
	RiExpandUpDownLine,
	RiFilter3Line,
} from "@remixicon/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useState,
	useTransition,
} from "react";
import {
	PAYMENT_METHODS,
	SETTLED_FILTER_VALUES,
	TRANSACTION_CONDITIONS,
	TRANSACTION_TYPES,
} from "@/features/transactions/constants";
import { Button } from "@/shared/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/components/ui/command";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/shared/components/ui/drawer";
import { Input } from "@/shared/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { slugify } from "@/shared/utils/string";
import { cn } from "@/shared/utils/ui";
import {
	AccountCardSelectContent,
	CategorySelectContent,
	ConditionSelectContent,
	PayerSelectContent,
	PaymentMethodSelectContent,
	TransactionTypeSelectContent,
} from "../select-items";
import type {
	AccountCardFilterOption,
	TransactionFilterOption,
} from "../types";

const FILTER_EMPTY_VALUE = "__all";

interface FilterSelectProps {
	param: string;
	placeholder: string;
	options: { value: string; label: string }[];
	widthClass?: string;
	disabled?: boolean;
	getParamValue: (key: string) => string;
	onChange: (key: string, value: string | null) => void;
	renderContent?: (label: string) => ReactNode;
}

function FilterSelect({
	param,
	placeholder,
	options,
	widthClass = "w-[130px]",
	disabled,
	getParamValue,
	onChange,
	renderContent,
}: FilterSelectProps) {
	const value = getParamValue(param);
	const current = options.find((option) => option.value === value);
	const displayLabel =
		value === FILTER_EMPTY_VALUE
			? placeholder
			: (current?.label ?? placeholder);

	return (
		<Select
			value={value}
			onValueChange={(nextValue) =>
				onChange(param, nextValue === FILTER_EMPTY_VALUE ? null : nextValue)
			}
			disabled={disabled}
		>
			<SelectTrigger
				className={cn("text-sm border-dashed", widthClass)}
				disabled={disabled}
			>
				<span className="truncate">
					{value !== FILTER_EMPTY_VALUE && current && renderContent
						? renderContent(current.label)
						: displayLabel}
				</span>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={FILTER_EMPTY_VALUE}>Todos</SelectItem>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{renderContent ? renderContent(option.label) : option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

interface TransactionsFiltersProps {
	payerOptions: TransactionFilterOption[];
	categoryOptions: TransactionFilterOption[];
	accountCardOptions: AccountCardFilterOption[];
	className?: string;
	exportButton?: ReactNode;
	hideAdvancedFilters?: boolean;
}

export function TransactionsFilters({
	payerOptions,
	categoryOptions,
	accountCardOptions,
	className,
	exportButton,
	hideAdvancedFilters = false,
}: TransactionsFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const getParamValue = (key: string) =>
		searchParams.get(key) ?? FILTER_EMPTY_VALUE;

	const handleFilterChange = useCallback(
		(key: string, value: string | null) => {
			const nextParams = new URLSearchParams(searchParams.toString());

			if (value && value !== FILTER_EMPTY_VALUE) {
				nextParams.set(key, value);
			} else {
				nextParams.delete(key);
			}

			nextParams.delete("page");

			startTransition(() => {
				const target = nextParams.toString()
					? `${pathname}?${nextParams.toString()}`
					: pathname;
				router.replace(target, { scroll: false });
			});
		},
		[searchParams, pathname, router],
	);

	const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
	const currentSearchParam = searchParams.get("q") ?? "";

	useEffect(() => {
		setSearchValue(currentSearchParam);
	}, [currentSearchParam]);

	useEffect(() => {
		if (searchValue === currentSearchParam) {
			return;
		}

		const timeout = setTimeout(() => {
			const normalized = searchValue.trim();
			handleFilterChange("q", normalized.length > 0 ? normalized : null);
		}, 350);

		return () => clearTimeout(timeout);
	}, [searchValue, currentSearchParam, handleFilterChange]);

	const handleReset = () => {
		const periodValue = searchParams.get("periodo");
		const pageSizeValue = searchParams.get("pageSize");
		const nextParams = new URLSearchParams();
		if (periodValue) {
			nextParams.set("periodo", periodValue);
		}
		if (pageSizeValue) {
			nextParams.set("pageSize", pageSizeValue);
		}
		setSearchValue("");
		setCategoryOpen(false);
		startTransition(() => {
			const target = nextParams.toString()
				? `${pathname}?${nextParams.toString()}`
				: pathname;
			router.replace(target, { scroll: false });
		});
	};

	const payerSelectOptions = payerOptions.map((option) => ({
		value: option.slug,
		label: option.label,
		avatarUrl: option.avatarUrl,
	}));

	const accountOptions = accountCardOptions
		.filter((option) => option.kind === "conta")
		.map((option) => ({
			value: option.slug,
			label: option.label,
			logo: option.logo,
		}));

	const cardOptions = accountCardOptions
		.filter((option) => option.kind === "cartao")
		.map((option) => ({
			value: option.slug,
			label: option.label,
			logo: option.logo,
		}));

	const categoryValue = getParamValue("category");
	const selectedCategory =
		categoryValue !== FILTER_EMPTY_VALUE
			? categoryOptions.find((option) => option.slug === categoryValue)
			: null;

	const payerValue = getParamValue("payer");
	const selectedPayer =
		payerValue !== FILTER_EMPTY_VALUE
			? payerOptions.find((option) => option.slug === payerValue)
			: null;

	const accountCardValue = getParamValue("accountCard");
	const selectedAccountCard =
		accountCardValue !== FILTER_EMPTY_VALUE
			? accountCardOptions.find((option) => option.slug === accountCardValue)
			: null;

	const [categoryOpen, setCategoryOpen] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const hasActiveFilters =
		searchParams.get("type") ||
		searchParams.get("condition") ||
		searchParams.get("payment") ||
		searchParams.get("payer") ||
		searchParams.get("category") ||
		searchParams.get("accountCard") ||
		searchParams.get("settled") ||
		searchParams.get("hasAttachment") ||
		searchParams.get("isDivided");

	const handleResetFilters = () => {
		handleReset();
		setDrawerOpen(false);
	};

	return (
		<div
			className={cn(
				"flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center",
				className,
			)}
		>
			<Input
				value={searchValue}
				onChange={(event) => setSearchValue(event.target.value)}
				placeholder="Buscar"
				aria-label="Buscar lançamentos"
				className="w-full md:w-[250px] text-sm border-dashed"
			/>

			<div className="flex w-full gap-2 md:w-auto">
				{exportButton && (
					<div className="flex-1 md:flex-none *:w-full *:md:w-auto">
						{exportButton}
					</div>
				)}

				{!hideAdvancedFilters && (
					<Drawer
						direction="right"
						open={drawerOpen}
						onOpenChange={setDrawerOpen}
					>
						<DrawerTrigger asChild>
							<Button
								variant="outline"
								className="flex-1 md:flex-none text-sm border-dashed relative bg-transparent"
								aria-label="Abrir filtros"
							>
								<RiFilter3Line className="size-4" />
								Filtros
								{hasActiveFilters && (
									<span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary" />
								)}
							</Button>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Filtros</DrawerTitle>
								<DrawerDescription>
									Selecione os filtros desejados para refinar os lançamentos
								</DrawerDescription>
							</DrawerHeader>

							<div className="flex-1 overflow-y-auto px-4 space-y-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Tipo de Lançamento
									</label>
									<FilterSelect
										param="type"
										placeholder="Todos"
										options={TRANSACTION_TYPES.map((v) => ({
											value: slugify(v),
											label: v,
										}))}
										widthClass="w-full border-dashed"
										disabled={isPending}
										getParamValue={getParamValue}
										onChange={handleFilterChange}
										renderContent={(label) => (
											<TransactionTypeSelectContent label={label} />
										)}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										Condição de Lançamento
									</label>
									<FilterSelect
										param="condition"
										placeholder="Todas"
										options={TRANSACTION_CONDITIONS.map((v) => ({
											value: slugify(v),
											label: v,
										}))}
										widthClass="w-full border-dashed"
										disabled={isPending}
										getParamValue={getParamValue}
										onChange={handleFilterChange}
										renderContent={(label) => (
											<ConditionSelectContent label={label} />
										)}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										Forma de Pagamento
									</label>
									<FilterSelect
										param="payment"
										placeholder="Todos"
										options={PAYMENT_METHODS.map((v) => ({
											value: slugify(v),
											label: v,
										}))}
										widthClass="w-full border-dashed"
										disabled={isPending}
										getParamValue={getParamValue}
										onChange={handleFilterChange}
										renderContent={(label) => (
											<PaymentMethodSelectContent label={label} />
										)}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Pessoa</label>
									<Select
										value={getParamValue("payer")}
										onValueChange={(value) =>
											handleFilterChange(
												"payer",
												value === FILTER_EMPTY_VALUE ? null : value,
											)
										}
										disabled={isPending}
									>
										<SelectTrigger
											className="w-full text-sm border-dashed"
											disabled={isPending}
										>
											<span className="truncate">
												{selectedPayer ? (
													<PayerSelectContent
														label={selectedPayer.label}
														avatarUrl={selectedPayer.avatarUrl}
													/>
												) : (
													"Todos"
												)}
											</span>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={FILTER_EMPTY_VALUE}>Todos</SelectItem>
											{payerSelectOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<PayerSelectContent
														label={option.label}
														avatarUrl={option.avatarUrl}
													/>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Categoria</label>
									<Popover
										open={categoryOpen}
										onOpenChange={setCategoryOpen}
										modal
									>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={categoryOpen}
												className="w-full justify-between text-sm border-dashed"
												disabled={isPending}
											>
												<span className="truncate flex items-center gap-2">
													{selectedCategory ? (
														<CategorySelectContent
															label={selectedCategory.label}
															icon={selectedCategory.icon}
														/>
													) : (
														"Todas"
													)}
												</span>
												<RiExpandUpDownLine className="ml-2 size-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent align="start" className="w-[220px] p-0">
											<Command>
												<CommandInput placeholder="Buscar categoria..." />
												<CommandList>
													<CommandEmpty>Nada encontrado.</CommandEmpty>
													<CommandGroup>
														<CommandItem
															value={FILTER_EMPTY_VALUE}
															onSelect={() => {
																handleFilterChange("category", null);
																setCategoryOpen(false);
															}}
														>
															Todas
															{categoryValue === FILTER_EMPTY_VALUE ? (
																<RiCheckLine className="ml-auto size-4" />
															) : null}
														</CommandItem>
														{categoryOptions.map((option) => (
															<CommandItem
																key={option.slug}
																value={option.slug}
																onSelect={() => {
																	handleFilterChange("category", option.slug);
																	setCategoryOpen(false);
																}}
															>
																<CategorySelectContent
																	label={option.label}
																	icon={option.icon}
																/>
																{categoryValue === option.slug ? (
																	<RiCheckLine className="ml-auto size-4" />
																) : null}
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Conta/Cartão</label>
									<Select
										value={getParamValue("accountCard")}
										onValueChange={(value) =>
											handleFilterChange(
												"accountCard",
												value === FILTER_EMPTY_VALUE ? null : value,
											)
										}
										disabled={isPending}
									>
										<SelectTrigger
											className="w-full text-sm border-dashed"
											disabled={isPending}
										>
											<span className="truncate">
												{selectedAccountCard ? (
													<AccountCardSelectContent
														label={selectedAccountCard.label}
														logo={selectedAccountCard.logo}
														isCartao={selectedAccountCard.kind === "cartao"}
													/>
												) : (
													"Todos"
												)}
											</span>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={FILTER_EMPTY_VALUE}>Todos</SelectItem>
											{accountOptions.length > 0 ? (
												<SelectGroup>
													<SelectLabel>Contas</SelectLabel>
													{accountOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<AccountCardSelectContent
																label={option.label}
																logo={option.logo}
																isCartao={false}
															/>
														</SelectItem>
													))}
												</SelectGroup>
											) : null}
											{cardOptions.length > 0 ? (
												<SelectGroup>
													<SelectLabel>Cartões</SelectLabel>
													{cardOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<AccountCardSelectContent
																label={option.label}
																logo={option.logo}
																isCartao={true}
															/>
														</SelectItem>
													))}
												</SelectGroup>
											) : null}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-3">
									<p className="text-sm font-medium">Status</p>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<label
												htmlFor="filter-pago"
												className="text-sm text-muted-foreground cursor-pointer"
											>
												Somente pagos
											</label>
											<Switch
												id="filter-pago"
												checked={
													searchParams.get("settled") ===
													SETTLED_FILTER_VALUES.PAID
												}
												disabled={isPending}
												onCheckedChange={(checked) => {
													handleFilterChange(
														"settled",
														checked ? SETTLED_FILTER_VALUES.PAID : null,
													);
												}}
											/>
										</div>
										<div className="flex items-center justify-between">
											<label
												htmlFor="filter-nao-pago"
												className="text-sm text-muted-foreground cursor-pointer"
											>
												Somente não pagos
											</label>
											<Switch
												id="filter-nao-pago"
												checked={
													searchParams.get("settled") ===
													SETTLED_FILTER_VALUES.UNPAID
												}
												disabled={isPending}
												onCheckedChange={(checked) => {
													handleFilterChange(
														"settled",
														checked ? SETTLED_FILTER_VALUES.UNPAID : null,
													);
												}}
											/>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<label
										htmlFor="filter-has-attachment"
										className="text-sm font-medium cursor-pointer"
									>
										Com anexo
									</label>
									<Switch
										id="filter-has-attachment"
										checked={searchParams.get("hasAttachment") === "true"}
										disabled={isPending}
										onCheckedChange={(checked) => {
											handleFilterChange(
												"hasAttachment",
												checked ? "true" : null,
											);
										}}
									/>
								</div>

								<div className="flex items-center justify-between">
									<label
										htmlFor="filter-is-divided"
										className="text-sm font-medium cursor-pointer"
									>
										Somente divididos
									</label>
									<Switch
										id="filter-is-divided"
										checked={searchParams.get("isDivided") === "true"}
										disabled={isPending}
										onCheckedChange={(checked) => {
											handleFilterChange("isDivided", checked ? "true" : null);
										}}
									/>
								</div>
							</div>

							<DrawerFooter>
								<Button
									type="button"
									variant="outline"
									onClick={handleResetFilters}
									disabled={isPending || !hasActiveFilters}
								>
									Limpar filtros
								</Button>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				)}
			</div>
		</div>
	);
}
