"use client";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { validateDateRange } from "@/lib/relatorios/utils";
import { getIconComponent } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/ui";
import { RiCheckLine, RiExpandUpDownLine, RiCalendarLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CategoryReportFiltersProps, FilterState } from "./types";
import type { ReactNode } from "react";

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

  // Convert period string (YYYY-MM) to Date object
  const periodToDate = (period: string): Date => {
    const [year, month] = period.split("-").map(Number);
    return new Date(year, month - 1, 1);
  };

  // Convert Date object to period string (YYYY-MM)
  const dateToPeriod = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Format date for display
  const formatMonthYear = (period: string): string => {
    const date = periodToDate(period);
    return format(date, "MMM/yyyy", { locale: ptBR });
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchValue) return categories;
    const search = searchValue.toLowerCase();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(search)
    );
  }, [categories, searchValue]);

  // Get selected categories for display
  const selectedCategories = useMemo(() => {
    if (filters.selectedCategories.length === 0) return [];
    return categories.filter((cat) =>
      filters.selectedCategories.includes(cat.id)
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
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const defaultStartPeriod = new Date();
    defaultStartPeriod.setMonth(defaultStartPeriod.getMonth() - 5);
    const startPeriod = defaultStartPeriod.toISOString().slice(0, 7);

    onFiltersChange({
      selectedCategories: [],
      startPeriod,
      endPeriod: currentPeriod,
    });
  };

  // Validate date range
  const validation = useMemo(() => {
    if (!filters.startPeriod || !filters.endPeriod) {
      return { isValid: true };
    }
    return validateDateRange(filters.startPeriod, filters.endPeriod);
  }, [filters.startPeriod, filters.endPeriod]);

  // Display text for selected categories
  const selectedText = useMemo(() => {
    if (selectedCategories.length === 0) {
      return "Categoria";
    }
    if (selectedCategories.length === categories.length) {
      return "Todas";
    }
    if (selectedCategories.length === 1) {
      return selectedCategories[0].name;
    }
    return `${selectedCategories.length} selecionadas`;
  }, [selectedCategories, categories.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Multi-Select */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label="Selecionar categorias para filtrar"
                className="w-[180px] justify-between text-sm border-dashed border-input"
                disabled={isLoading}
              >
                <span className="truncate">{selectedText}</span>
                <RiExpandUpDownLine className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
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
                        category.id
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
                              <IconComponent className="h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                            <span className="truncate">{category.name}</span>
                          </div>
                          {isSelected && (
                            <RiCheckLine className="ml-auto h-4 w-4" aria-hidden="true" />
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
                className="w-[150px] justify-start text-sm border-dashed"
                disabled={isLoading}
              >
                <RiCalendarLine className="mr-2 h-4 w-4" />
                {formatMonthYear(filters.startPeriod)}
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
                className="w-[150px] justify-start text-sm border-dashed"
                disabled={isLoading}
              >
                <RiCalendarLine className="mr-2 h-4 w-4" />
                {formatMonthYear(filters.endPeriod)}
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
          >
            Limpar
          </Button>
        </div>

        {/* Export Button */}
        {exportButton}
      </div>

      {/* Validation Message */}
      {!validation.isValid && validation.error && (
        <div className="text-sm text-destructive">
          {validation.error}
        </div>
      )}
    </div>
  );
}
