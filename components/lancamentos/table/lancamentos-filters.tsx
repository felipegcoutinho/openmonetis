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
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select";
import {
	LANCAMENTO_CONDITIONS,
	LANCAMENTO_PAYMENT_METHODS,
	LANCAMENTO_TRANSACTION_TYPES,
} from "@/lib/lancamentos/constants";
import { cn } from "@/lib/utils/ui";
import {
	CategoriaSelectContent,
	ConditionSelectContent,
	ContaCartaoSelectContent,
	PagadorSelectContent,
	PaymentMethodSelectContent,
	TransactionTypeSelectContent,
} from "../select-items";
import type { ContaCartaoFilterOption, LancamentoFilterOption } from "../types";

const FILTER_EMPTY_VALUE = "__all";

const buildStaticOptions = (values: readonly string[]) =>
	values.map((value) => ({ value, label: value }));

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

interface LancamentosFiltersProps {
	pagadorOptions: LancamentoFilterOption[];
	categoriaOptions: LancamentoFilterOption[];
	contaCartaoOptions: ContaCartaoFilterOption[];
	className?: string;
	exportButton?: ReactNode;
	hideAdvancedFilters?: boolean;
}

export function LancamentosFilters({
	pagadorOptions,
	categoriaOptions,
	contaCartaoOptions,
	className,
	exportButton,
	hideAdvancedFilters = false,
}: LancamentosFiltersProps) {
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

			startTransition(() => {
				router.replace(`${pathname}?${nextParams.toString()}`, {
					scroll: false,
				});
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
		const nextParams = new URLSearchParams();
		if (periodValue) {
			nextParams.set("periodo", periodValue);
		}
		setSearchValue("");
		setCategoriaOpen(false);
		startTransition(() => {
			const target = nextParams.toString()
				? `${pathname}?${nextParams.toString()}`
				: pathname;
			router.replace(target, { scroll: false });
		});
	};

	const pagadorSelectOptions = pagadorOptions.map((option) => ({
		value: option.slug,
		label: option.label,
		avatarUrl: option.avatarUrl,
	}));

	const contaOptions = contaCartaoOptions
		.filter((option) => option.kind === "conta")
		.map((option) => ({
			value: option.slug,
			label: option.label,
			logo: option.logo,
		}));

	const cartaoOptions = contaCartaoOptions
		.filter((option) => option.kind === "cartao")
		.map((option) => ({
			value: option.slug,
			label: option.label,
			logo: option.logo,
		}));

	const categoriaValue = getParamValue("categoria");
	const selectedCategoria =
		categoriaValue !== FILTER_EMPTY_VALUE
			? categoriaOptions.find((option) => option.slug === categoriaValue)
			: null;

	const pagadorValue = getParamValue("pagador");
	const selectedPagador =
		pagadorValue !== FILTER_EMPTY_VALUE
			? pagadorOptions.find((option) => option.slug === pagadorValue)
			: null;

	const contaCartaoValue = getParamValue("contaCartao");
	const selectedContaCartao =
		contaCartaoValue !== FILTER_EMPTY_VALUE
			? contaCartaoOptions.find((option) => option.slug === contaCartaoValue)
			: null;

	const [categoriaOpen, setCategoriaOpen] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const hasActiveFilters =
		searchParams.get("transacao") ||
		searchParams.get("condicao") ||
		searchParams.get("pagamento") ||
		searchParams.get("pagador") ||
		searchParams.get("categoria") ||
		searchParams.get("contaCartao");

	const handleResetFilters = () => {
		handleReset();
		setDrawerOpen(false);
	};

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			<Input
				value={searchValue}
				onChange={(event) => setSearchValue(event.target.value)}
				placeholder="Buscar"
				aria-label="Buscar lançamentos"
				className="w-[250px] text-sm border-dashed"
			/>

			{exportButton}

			{!hideAdvancedFilters && (
				<Drawer
					direction="right"
					open={drawerOpen}
					onOpenChange={setDrawerOpen}
				>
					<DrawerTrigger asChild>
						<Button
							variant="outline"
							className="text-sm border-dashed relative"
							aria-label="Abrir filtros"
						>
							<RiFilter3Line className="size-4" />
							Filtros
							{hasActiveFilters && (
								<span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
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
									param="transacao"
									placeholder="Todos"
									options={buildStaticOptions(LANCAMENTO_TRANSACTION_TYPES)}
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
									param="condicao"
									placeholder="Todas"
									options={buildStaticOptions(LANCAMENTO_CONDITIONS)}
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
									param="pagamento"
									placeholder="Todos"
									options={buildStaticOptions(LANCAMENTO_PAYMENT_METHODS)}
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
								<label className="text-sm font-medium">Pagador</label>
								<Select
									value={getParamValue("pagador")}
									onValueChange={(value) =>
										handleFilterChange(
											"pagador",
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
											{selectedPagador ? (
												<PagadorSelectContent
													label={selectedPagador.label}
													avatarUrl={selectedPagador.avatarUrl}
												/>
											) : (
												"Todos"
											)}
										</span>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={FILTER_EMPTY_VALUE}>Todos</SelectItem>
										{pagadorSelectOptions.map((option) => (
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

							<div className="space-y-2">
								<label className="text-sm font-medium">Categoria</label>
								<Popover
									open={categoriaOpen}
									onOpenChange={setCategoriaOpen}
									modal
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={categoriaOpen}
											className="w-full justify-between text-sm border-dashed"
											disabled={isPending}
										>
											<span className="truncate flex items-center gap-2">
												{selectedCategoria ? (
													<CategoriaSelectContent
														label={selectedCategoria.label}
														icon={selectedCategoria.icon}
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
															handleFilterChange("categoria", null);
															setCategoriaOpen(false);
														}}
													>
														Todas
														{categoriaValue === FILTER_EMPTY_VALUE ? (
															<RiCheckLine className="ml-auto size-4" />
														) : null}
													</CommandItem>
													{categoriaOptions.map((option) => (
														<CommandItem
															key={option.slug}
															value={option.slug}
															onSelect={() => {
																handleFilterChange("categoria", option.slug);
																setCategoriaOpen(false);
															}}
														>
															<CategoriaSelectContent
																label={option.label}
																icon={option.icon}
															/>
															{categoriaValue === option.slug ? (
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
									value={getParamValue("contaCartao")}
									onValueChange={(value) =>
										handleFilterChange(
											"contaCartao",
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
											{selectedContaCartao ? (
												<ContaCartaoSelectContent
													label={selectedContaCartao.label}
													logo={selectedContaCartao.logo}
													isCartao={selectedContaCartao.kind === "cartao"}
												/>
											) : (
												"Todos"
											)}
										</span>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={FILTER_EMPTY_VALUE}>Todos</SelectItem>
										{contaOptions.length > 0 ? (
											<SelectGroup>
												<SelectLabel>Contas</SelectLabel>
												{contaOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														<ContaCartaoSelectContent
															label={option.label}
															logo={option.logo}
															isCartao={false}
														/>
													</SelectItem>
												))}
											</SelectGroup>
										) : null}
										{cartaoOptions.length > 0 ? (
											<SelectGroup>
												<SelectLabel>Cartões</SelectLabel>
												{cartaoOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														<ContaCartaoSelectContent
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
	);
}
