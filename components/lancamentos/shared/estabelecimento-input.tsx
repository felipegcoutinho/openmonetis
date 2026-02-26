"use client";

import { RiSearchLine } from "@remixicon/react";
import * as React from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export interface EstabelecimentoInputProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	estabelecimentos: string[];
	placeholder?: string;
	required?: boolean;
	maxLength?: number;
}

export function EstabelecimentoInput({
	id,
	value,
	onChange,
	estabelecimentos = [],
	placeholder = "Ex.: Padaria, Transferência, Saldo inicial",
	required = false,
	maxLength = 20,
}: EstabelecimentoInputProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState("");

	const handleSelect = (selectedValue: string) => {
		onChange(selectedValue);
		setOpen(false);
		setSearchValue("");
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);
		setSearchValue(newValue);

		// Open popover when user types and there are suggestions
		if (newValue.length > 0 && estabelecimentos.length > 0) {
			setOpen(true);
		}
	};

	const filteredEstabelecimentos = React.useMemo(() => {
		if (!searchValue) return estabelecimentos;

		const lowerSearch = searchValue.toLowerCase();
		return estabelecimentos.filter((item) =>
			item.toLowerCase().includes(lowerSearch),
		);
	}, [estabelecimentos, searchValue]);

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<div className="relative">
					<Input
						id={id}
						value={value}
						onChange={handleInputChange}
						placeholder={placeholder}
						required={required}
						maxLength={maxLength}
						autoComplete="off"
					/>
					{estabelecimentos.length > 0 && (
						<RiSearchLine className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					)}
				</div>
			</PopoverTrigger>
			{estabelecimentos.length > 0 && (
				<PopoverContent
					className="p-0 w-[--radix-popover-trigger-width]"
					align="start"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command>
						<CommandList className="max-h-[300px] overflow-y-auto">
							<CommandEmpty className="p-6">
								Nenhum estabelecimento encontrado.
							</CommandEmpty>
							<CommandGroup className="p-1">
								{filteredEstabelecimentos.map((item) => (
									<CommandItem
										key={item}
										value={item}
										onSelect={() => handleSelect(item)}
										className="cursor-pointer"
									>
										<span
											className={`truncate flex-1 ${value === item ? "font-semibold" : ""}`}
										>
											{item}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			)}
		</Popover>
	);
}
