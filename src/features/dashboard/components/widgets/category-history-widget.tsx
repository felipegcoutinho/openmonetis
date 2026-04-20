"use client";
import {
	RiArrowDownSLine,
	RiBarChartBoxLine,
	RiCloseLine,
} from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { CategoryHistoryData } from "@/features/dashboard/categories/category-history-queries";
import { Button } from "@/shared/components/ui/button";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/shared/components/ui/chart";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { CATEGORY_COLORS } from "@/shared/utils/category-colors";
import { formatCurrency, formatCurrencyCompact } from "@/shared/utils/currency";
import { getIconComponent } from "@/shared/utils/icons";

type CategoryHistoryWidgetProps = {
	data: CategoryHistoryData;
};

const STORAGE_KEY_SELECTED = "dashboard-category-history-selected";

const CHART_COLORS = CATEGORY_COLORS;

export function CategoryHistoryWidget({ data }: CategoryHistoryWidgetProps) {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [isClient, setIsClient] = useState(false);
	const [open, setOpen] = useState(false);
	const isFirstRender = useRef(true);

	// Load from sessionStorage on mount and save on changes
	useEffect(() => {
		setIsClient(true);

		// Only load from storage on first render
		if (isFirstRender.current) {
			const stored = sessionStorage.getItem(STORAGE_KEY_SELECTED);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					if (Array.isArray(parsed)) {
						const validCategories = parsed.filter((id) =>
							data.allCategories.some((cat) => cat.id === id),
						);
						setSelectedCategories(validCategories.slice(0, 5));
					}
				} catch (_e) {
					// Invalid JSON, ignore
				}
			}
			isFirstRender.current = false;
		} else {
			// Save to storage on subsequent changes
			sessionStorage.setItem(
				STORAGE_KEY_SELECTED,
				JSON.stringify(selectedCategories),
			);
		}
	}, [selectedCategories, data.allCategories]);

	// Filter data to show only selected categories with vibrant colors
	const filteredCategories = useMemo(() => {
		return selectedCategories
			.map((id, index) => {
				const cat = data.categories.find((c) => c.id === id);
				if (!cat) return null;
				return {
					...cat,
					color: CHART_COLORS[index % CHART_COLORS.length],
				};
			})
			.filter(Boolean) as Array<{
			id: string;
			name: string;
			icon: string | null;
			color: string;
			data: Record<string, number>;
		}>;
	}, [data.categories, selectedCategories]);

	// Filter chart data to include only selected categories
	const filteredChartData = useMemo(() => {
		if (filteredCategories.length === 0) {
			return data.chartData.map((item) => ({ month: item.month }));
		}

		return data.chartData.map((item) => {
			const filtered: Record<string, number | string> = { month: item.month };
			filteredCategories.forEach((category) => {
				filtered[category.name] = item[category.name] || 0;
			});
			return filtered;
		});
	}, [data.chartData, filteredCategories]);

	// Build chart config dynamically from filtered categories
	const chartConfig = useMemo(() => {
		const config: ChartConfig = {};

		filteredCategories.forEach((category) => {
			config[category.name] = {
				label: category.name,
				color: category.color,
			};
		});

		return config;
	}, [filteredCategories]);

	const handleAddCategory = (categoryId: string) => {
		if (
			categoryId &&
			!selectedCategories.includes(categoryId) &&
			selectedCategories.length < 5
		) {
			setSelectedCategories([...selectedCategories, categoryId]);
			setOpen(false);
		}
	};

	const handleRemoveCategory = (categoryId: string) => {
		setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
	};

	const handleClearAll = () => {
		setSelectedCategories([]);
	};

	const availableCategories = useMemo(() => {
		return data.allCategories.filter(
			(cat) => !selectedCategories.includes(cat.id),
		);
	}, [data.allCategories, selectedCategories]);

	const selectedCategoryDetails = useMemo(() => {
		return selectedCategories
			.map((id) => data.allCategories.find((cat) => cat.id === id))
			.filter(Boolean);
	}, [selectedCategories, data.allCategories]);

	const isEmpty = filteredCategories.length === 0;

	// Group available categories by type
	const { despesaCategories, receitaCategories } = useMemo(() => {
		const despesa = availableCategories.filter((cat) => cat.type === "despesa");
		const receita = availableCategories.filter((cat) => cat.type === "receita");
		return { despesaCategories: despesa, receitaCategories: receita };
	}, [availableCategories]);

	if (!isClient) {
		return null;
	}

	return (
		<div className="space-y-2.5">
			<div className="space-y-2">
				{selectedCategoryDetails.length > 0 && (
					<div className="flex items-start justify-between gap-4 mb-4">
						<div className="flex flex-wrap gap-2">
							{selectedCategoryDetails.map((category, colorIndex) => {
								if (!category) return null;
								const IconComponent = category.icon
									? getIconComponent(category.icon)
									: null;
								const color = CHART_COLORS[colorIndex % CHART_COLORS.length];

								return (
									<div
										key={category.id}
										className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm"
										style={{ borderColor: color }}
									>
										{IconComponent ? (
											<span style={{ color }}>
												<IconComponent className="size-4" />
											</span>
										) : (
											<div
												className="size-3 rounded-sm"
												style={{ backgroundColor: color }}
											/>
										)}
										<span className="text-sm font-medium text-foreground">
											{category.name}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-4 w-4 p-0 hover:bg-transparent"
											onClick={() => handleRemoveCategory(category.id)}
										>
											<RiCloseLine className="size-3" />
										</Button>
									</div>
								);
							})}
						</div>
						<div className="flex items-center gap-2 shrink-0 pt-1.5">
							<span className="text-xs text-muted-foreground whitespace-nowrap">
								{selectedCategories.length}/5 selecionadas
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClearAll}
								className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
							>
								Limpar
							</Button>
						</div>
					</div>
				)}

				{selectedCategories.length < 5 && availableCategories.length > 0 && (
					<Popover open={open} onOpenChange={setOpen} modal>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="w-full justify-between hover:scale-none"
							>
								Selecionar categorias
								<RiArrowDownSLine className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-(--radix-popover-trigger-width) p-0"
							align="start"
						>
							<Command>
								<CommandInput placeholder="Pesquisar categoria..." />
								<CommandList>
									<CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>

									{despesaCategories.length > 0 && (
										<CommandGroup heading="Despesas">
											{despesaCategories.map((category) => {
												const IconComponent = category.icon
													? getIconComponent(category.icon)
													: null;
												return (
													<CommandItem
														key={category.id}
														value={category.name}
														onSelect={() => handleAddCategory(category.id)}
														className="gap-2"
													>
														{IconComponent ? (
															<IconComponent className="size-4 text-destructive" />
														) : (
															<div className="size-3 rounded-sm bg-destructive" />
														)}
														<span>{category.name}</span>
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}

									{receitaCategories.length > 0 && (
										<CommandGroup heading="Receitas">
											{receitaCategories.map((category) => {
												const IconComponent = category.icon
													? getIconComponent(category.icon)
													: null;
												return (
													<CommandItem
														key={category.id}
														value={category.name}
														onSelect={() => handleAddCategory(category.id)}
														className="gap-2"
													>
														{IconComponent ? (
															<IconComponent className="size-4 text-success" />
														) : (
															<div className="size-3 rounded-sm bg-success" />
														)}
														<span>{category.name}</span>
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{isEmpty ? (
				<div className="h-[450px] flex items-center justify-center">
					<WidgetEmptyState
						icon={
							<RiBarChartBoxLine className="size-6 text-muted-foreground" />
						}
						title="Selecione categorias para visualizar"
						description="Escolha até 5 categorias para acompanhar o histórico dos últimos 8 meses, mês atual e próximo mês."
					/>
				</div>
			) : (
				<ChartContainer config={chartConfig} className="h-[450px] w-full">
					<AreaChart
						data={filteredChartData}
						margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
					>
						<defs>
							{filteredCategories.map((category) => (
								<linearGradient
									key={`gradient-${category.id}`}
									id={`gradient-${category.id}`}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={category.color}
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor={category.color}
										stopOpacity={0.05}
									/>
								</linearGradient>
							))}
						</defs>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-xs"
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-xs"
							tickFormatter={(value) => formatCurrencyCompact(Number(value))}
						/>
						<ChartTooltip
							content={({ active, payload }) => {
								if (!active || !payload || payload.length === 0) {
									return null;
								}

								// Sort payload by value (descending)
								const sortedPayload = [...payload].sort(
									(a, b) => (b.value as number) - (a.value as number),
								);

								return (
									<div className="rounded-lg border bg-background p-3 shadow-lg">
										<div className="mb-2 text-xs font-medium text-muted-foreground">
											{payload[0].payload.month}
										</div>
										<div className="grid gap-1.5">
											{sortedPayload
												.filter((entry) => (entry.value as number) > 0)
												.map((entry) => {
													const config =
														chartConfig[
															entry.dataKey as keyof typeof chartConfig
														];
													const value = entry.value as number;

													return (
														<div
															key={String(entry.dataKey ?? entry.name)}
															className="flex items-center justify-between gap-4"
														>
															<div className="flex items-center gap-2">
																<div
																	className="h-2.5 w-2.5 rounded-sm shrink-0"
																	style={{ backgroundColor: config?.color }}
																/>
																<span className="text-xs text-muted-foreground truncate max-w-[150px]">
																	{config?.label}
																</span>
															</div>
															<span className="text-xs font-medium">
																{formatCurrency(value)}
															</span>
														</div>
													);
												})}
										</div>
									</div>
								);
							}}
							cursor={{
								stroke: "hsl(var(--muted-foreground))",
								strokeWidth: 1,
							}}
						/>
						{filteredCategories.map((category) => (
							<Area
								key={category.id}
								type="monotone"
								dataKey={category.name}
								stroke={category.color}
								strokeWidth={1}
								fill={`url(#gradient-${category.id})`}
								fillOpacity={1}
								dot={false}
								activeDot={{
									r: 5,
									fill: category.color,
									stroke: "hsl(var(--background))",
									strokeWidth: 2,
								}}
							/>
						))}
					</AreaChart>
				</ChartContainer>
			)}
		</div>
	);
}
