"use client";

import { RiMoreLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	CATEGORY_TYPE_LABEL,
	CATEGORY_TYPES,
} from "@/shared/lib/categories/constants";
import { getCategoryIconOptions } from "@/shared/lib/categories/icons";
import { cn } from "@/shared/utils/ui";

import { CategoryIcon } from "./category-icon";
import { TypeSelectContent } from "./category-select-items";
import type { CategoryFormValues } from "./types";

interface CategoryFormFieldsProps {
	values: CategoryFormValues;
	onChange: (field: keyof CategoryFormValues, value: string) => void;
}

export function CategoryFormFields({
	values,
	onChange,
}: CategoryFormFieldsProps) {
	const [popoverOpen, setPopoverOpen] = useState(false);
	const iconOptions = getCategoryIconOptions();

	const handleIconSelect = (icon: string) => {
		onChange("icon", icon);
		setPopoverOpen(false);
	};

	return (
		<div className="grid grid-cols-1 gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor="category-name">Nome</Label>
				<Input
					id="category-name"
					value={values.name}
					onChange={(event) => onChange("name", event.target.value)}
					placeholder="Ex.: Alimentação"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="category-type">Tipo da categoria</Label>
				<Select
					value={values.type}
					onValueChange={(value) => onChange("type", value)}
				>
					<SelectTrigger id="category-type" className="w-full">
						<SelectValue placeholder="Selecione o tipo">
							{values.type && (
								<TypeSelectContent label={CATEGORY_TYPE_LABEL[values.type]} />
							)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{CATEGORY_TYPES.map((type) => (
							<SelectItem key={type} value={type}>
								<TypeSelectContent label={CATEGORY_TYPE_LABEL[type]} />
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label>Ícone</Label>
				<div className="flex items-center gap-3">
					<div className="flex size-12 items-center justify-center rounded-lg border bg-muted/30 text-primary">
						{values.icon ? (
							<CategoryIcon name={values.icon} className="size-7" />
						) : (
							<RiMoreLine className="size-6 text-muted-foreground" />
						)}
					</div>
					<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
						<PopoverTrigger asChild>
							<Button type="button" variant="outline" className="flex-1">
								Selecionar ícone
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[480px] p-3" align="start">
							<div className="grid max-h-96 grid-cols-8 gap-2 overflow-y-auto">
								{iconOptions.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() => handleIconSelect(option.value)}
										className={cn(
											"flex size-12 items-center justify-center rounded-lg border transition-all hover:border-primary hover:bg-primary/5",
											values.icon === option.value
												? "border-primary bg-primary/10 text-primary"
												: "border-border text-muted-foreground hover:text-primary",
										)}
										title={option.label}
									>
										<CategoryIcon name={option.value} className="size-6" />
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>
				<p className="text-xs text-muted-foreground">
					Escolha um ícone que represente melhor esta categoria.
				</p>
			</div>
		</div>
	);
}
