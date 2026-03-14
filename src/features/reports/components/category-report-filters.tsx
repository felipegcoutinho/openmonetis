"use client";

import {
	RiCalendarLine,
	RiCheckLine,
	RiExpandUpDownLine,
} from "@remixicon/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { validateDateRange } from "@/features/reports/utils";
import { Button } from "@/shared/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/components/ui/command";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { getIconComponent } from "@/shared/utils/icons";
import {
	addMonthsToPeriod,
	dateToPeriod,
	formatShortPeriodLabel,
	getCurrentPeriod,
	periodToDate,
} from "@/shared/utils/period";
import type { CategoryReportFiltersProps } from "./types";

/**
 * Category Report Filters Component
 * Provides filters for categories selection and date range
 */
export function CategoryReportFilters({
	categories,
	filters,
	onFiltersChange,
	isLoading = false,
	exportButton,
}: CategoryReportFiltersProps & { exportButton?: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [startMonthOpen, setStartMonthOpen] = useState(false);
	const [endMonthOpen, setEndMonthOpen] = useState(false);

	// Filter categories by search
	const filteredCategories = useMemo(() => {
		if (!searchValue) return categories;
		const search = searchValue.toLowerCase();
		return categories.filter((cat) => cat.name.toLowerCase().includes(search));
	}, [categories, searchValue]);

	// Get selected categories for display
	const selectedCategories = useMemo(() => {
		if (filters.selectedCategories.length === 0) return [];
		return categories.filter((cat) =>
			filters.selectedCategories.includes(cat.id),
		);
	}, [categories, filters.selectedCategories]);

	// Handle category toggle
	const handleCategoryToggle = (categoryId: string) => {
		const newSelected = filters.selectedCategories.includes(categoryId)
			? filters.selectedCategories.filter((id) => id !== categoryId)
			: [...filters.selectedCategories, categoryId];

		onFiltersChange({
			...filters,
			selectedCategories: newSelected,
		});
	};

	// Handle select all
	const handleSelectAll = () => {
		onFiltersChange({
			...filters,
			selectedCategories: categories.map((cat) => cat.id),
		});
		setOpen(false);
	};

	// Handle clear all
	const handleClearAll = () => {
		onFiltersChange({
			...filters,
			selectedCategories: [],
		});
		setOpen(false);
	};

	// Handle date change from MonthPicker
	const handleDateChange = (field: "startPeriod" | "endPeriod", date: Date) => {
		const period = dateToPeriod(date);
		onFiltersChange({
			...filters,
			[field]: period,
		});

		// Close the popover after selection
		if (field === "startPeriod") {
			setStartMonthOpen(false);
		} else {
			setEndMonthOpen(false);
		}
	};

	// Handle reset all filters
	const handleReset = () => {
		const currentPeriod = getCurrentPeriod();
		const startPeriod = addMonthsToPeriod(currentPeriod, -5);

		onFiltersChange({
			selectedCategories: [],
			startPeriod,
			endPeriod: currentPeriod,
		});
	};

	const validation =
		!filters.startPeriod || !filters.endPeriod
			? { isValid: true }
			: validateDateRange(filters.startPeriod, filters.endPeriod);

	const selectedText =
		selectedCategories.length === 0
			? "Categoria"
			: selectedCategories.length === categories.length
				? "Todas"
				: selectedCategories.length === 1
					? selectedCategories[0].name
					: `${selectedCategories.length} selecionadas`;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-center gap-2 md:justify-between">
				<div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:justify-start">
					{/* Category Multi-Select */}
					<Popover open={open} onOpenChange={setOpen} modal>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								aria-label="Selecionar categorias para filtrar"
								className="w-full md:w-[180px] justify-between text-sm border-dashed border-input"
								disabled={isLoading}
							>
								<span className="truncate">{selectedText}</span>
								<RiExpandUpDownLine
									className="ml-2 h-4 w-4 shrink-0 opacity-50"
									aria-hidden="true"
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[220px] p-0" align="start">
							<Command>
								<CommandInput
									placeholder="Buscar categoria..."
									value={searchValue}
									onValueChange={setSearchValue}
								/>
								<CommandList>
									<CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
									<CommandGroup>
										{/* Select All / Clear All */}
										<div className="flex gap-1 p-2 border-b">
											<Button
												variant="ghost"
												size="sm"
												className="h-7 text-xs flex-1"
												onClick={handleSelectAll}
											>
												Todas
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 text-xs flex-1"
												onClick={handleClearAll}
											>
												Limpar
											</Button>
										</div>

										{/* Category List */}
										{filteredCategories.map((category) => {
											const isSelected = filters.selectedCategories.includes(
												category.id,
											);
											const IconComponent = category.icon
												? getIconComponent(category.icon)
												: null;

											return (
												<CommandItem
													key={category.id}
													value={category.id}
													onSelect={() => handleCategoryToggle(category.id)}
													className="cursor-pointer"
												>
													<div className="flex items-center gap-2 flex-1">
														{IconComponent && (
															<IconComponent
																className="h-4 w-4 shrink-0"
																aria-hidden="true"
															/>
														)}
														<span className="truncate">{category.name}</span>
													</div>
													{isSelected && (
														<RiCheckLine
															className="ml-auto h-4 w-4"
															aria-hidden="true"
														/>
													)}
												</CommandItem>
											);
										})}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{/* Start Period Picker */}
					<Popover open={startMonthOpen} onOpenChange={setStartMonthOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-[calc(50%-0.25rem)] md:w-[150px] justify-start text-sm border-dashed"
								disabled={isLoading}
							>
								<RiCalendarLine className="mr-2 h-4 w-4" />
								{formatShortPeriodLabel(filters.startPeriod)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<MonthPicker
								selectedMonth={periodToDate(filters.startPeriod)}
								onMonthSelect={(date) => handleDateChange("startPeriod", date)}
							/>
						</PopoverContent>
					</Popover>

					{/* End Period Picker */}
					<Popover open={endMonthOpen} onOpenChange={setEndMonthOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-[calc(50%-0.25rem)] md:w-[150px] justify-start text-sm border-dashed"
								disabled={isLoading}
							>
								<RiCalendarLine className="mr-2 h-4 w-4" />
								{formatShortPeriodLabel(filters.endPeriod)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<MonthPicker
								selectedMonth={periodToDate(filters.endPeriod)}
								onMonthSelect={(date) => handleDateChange("endPeriod", date)}
							/>
						</PopoverContent>
					</Popover>

					{/* Reset Button */}
					<Button
						type="button"
						variant="link"
						size="sm"
						onClick={handleReset}
						disabled={isLoading}
						className="w-full text-center md:w-auto md:text-left"
					>
						Limpar
					</Button>
				</div>

				{/* Export Button */}
				<div className="w-full md:w-auto">{exportButton}</div>
			</div>

			{/* Validation Message */}
			{!validation.isValid && validation.error && (
				<div className="text-sm text-destructive">{validation.error}</div>
			)}
		</div>
	);
}
