"use client";

import Image from "next/image";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { deriveNameFromLogo, resolveLogoSrc } from "@/shared/lib/logo";
import { cn } from "@/shared/utils/ui";

const DEFAULT_BASE_PATH = "/logos";

interface LogoPickerTriggerProps {
	selectedLogo?: string | null;
	disabled?: boolean;
	helperText?: string;
	placeholder?: string;
	basePath?: string;
	onOpen: () => void;
	className?: string;
}

export function LogoPickerTrigger({
	selectedLogo,
	disabled,
	helperText = "Clique para trocar o logo",
	placeholder = "Selecionar logo",
	basePath = DEFAULT_BASE_PATH,
	onOpen,
	className,
}: LogoPickerTriggerProps) {
	const hasLogo = Boolean(selectedLogo);
	const selectedLogoLabel = deriveNameFromLogo(selectedLogo);
	const selectedLogoPath =
		hasLogo && selectedLogo ? resolveLogoSrc(selectedLogo, { basePath }) : null;

	return (
		<button
			type="button"
			onClick={onOpen}
			disabled={disabled}
			className={cn(
				"flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
				className,
			)}
		>
			<span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/40 bg-background shadow-xs">
				{selectedLogoPath ? (
					<Image
						src={selectedLogoPath}
						alt={selectedLogoLabel || "Logo selecionado"}
						fill
						sizes="32px"
						className="object-contain p-0.5"
					/>
				) : (
					<span className="text-xs text-muted-foreground">Logo</span>
				)}
			</span>

			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-sm font-medium text-foreground">
					{selectedLogoLabel || placeholder}
				</span>
				<span className="text-xs text-muted-foreground">
					{disabled ? "Nenhum logo disponível" : helperText}
				</span>
			</span>
		</button>
	);
}

interface LogoPickerDialogProps {
	open: boolean;
	logos: string[];
	value: string;
	onOpenChange: (open: boolean) => void;
	onSelect: (logo: string) => void;
	basePath?: string;
	title?: string;
	description?: string;
	emptyState?: React.ReactNode;
}

export function LogoPickerDialog({
	open,
	logos,
	value,
	onOpenChange,
	onSelect,
	basePath = DEFAULT_BASE_PATH,
	title = "Escolher logo",
	description = "Selecione o logo que será usado para identificar este item.",
	emptyState,
}: LogoPickerDialogProps) {
	const [search, setSearch] = useState("");

	const filteredLogos = logos.filter((logo) => {
		if (!search.trim()) return true;
		const logoLabel = deriveNameFromLogo(logo).toLowerCase();
		return logoLabel.includes(search.toLowerCase().trim());
	});

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) setSearch("");
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>

				{logos.length > 0 && (
					<Input
						type="text"
						placeholder="Pesquisar..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-8 text-sm"
					/>
				)}

				{logos.length === 0 ? (
					(emptyState ?? (
						<p className="text-sm text-muted-foreground">
							Nenhum logo encontrado. Adicione arquivos na pasta de logos.
						</p>
					))
				) : filteredLogos.length === 0 ? (
					<p className="py-4 text-center text-sm text-muted-foreground">
						Nenhum logo encontrado para &ldquo;{search}&rdquo;
					</p>
				) : (
					<div className="grid max-h-custom-height-card grid-cols-4 gap-2 overflow-y-auto p-1 md:grid-cols-5">
						{filteredLogos.map((logo) => {
							const isActive = value === logo;
							const logoLabel = deriveNameFromLogo(logo);

							return (
								<button
									type="button"
									key={logo}
									onClick={() => onSelect(logo)}
									onPointerDown={(e) => e.stopPropagation()}
									aria-label={`Selecionar logo ${logoLabel || logo}`}
									aria-pressed={isActive}
									className={cn(
										"flex flex-col items-center gap-1 rounded-md bg-card p-2 text-center text-xs transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
										isActive &&
											"border-primary bg-primary/5 ring-2 ring-primary/40",
									)}
								>
									<span className="flex w-full items-center justify-center">
										<span className="relative size-10 overflow-hidden rounded-full">
											<Image
												src={resolveLogoSrc(logo, { basePath }) ?? logo}
												alt={logoLabel || logo}
												fill
												sizes="40px"
												className="object-contain"
											/>
										</span>
									</span>
									<span className="line-clamp-1 text-xs leading-tight text-muted-foreground">
										{logoLabel}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
