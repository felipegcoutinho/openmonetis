"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/shared/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Spinner } from "@/shared/components/ui/spinner";
import { logoQueryKeys, toNameKey } from "@/shared/lib/logo";
import {
	removeEstablishmentLogoAction,
	saveEstablishmentLogoAction,
} from "@/shared/lib/logo/establishment-logo-actions";
import {
	buildInitials,
	getCategoryBgColorFromName,
	getCategoryColorFromName,
} from "@/shared/utils/category-colors";
import { cn } from "@/shared/utils/ui";

interface LogoResult {
	name: string;
	domain: string;
	/** URL da imagem construída server-side — cliente usa direto sem token. */
	logoUrl: string | null;
}

async function fetchLogoResults(query: string): Promise<LogoResult[]> {
	if (!query.trim()) return [];
	const res = await fetch(
		`/api/logo/search?q=${encodeURIComponent(query.trim())}`,
	);
	if (!res.ok) return [];
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

interface EstablishmentLogoPickerProps {
	name: string;
	resolvedDomain: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (domain: string | null) => void;
	children: React.ReactNode;
}

export function EstablishmentLogoPicker({
	name,
	resolvedDomain,
	open,
	onOpenChange,
	onSelect,
	children,
}: EstablishmentLogoPickerProps) {
	const [isPending, startTransition] = useTransition();
	const [searchInput, setSearchInput] = useState(name);
	const [debouncedSearch, setDebouncedSearch] = useState(name);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (open) {
			setSearchInput(name);
			setDebouncedSearch(name);
		}
	}, [open, name]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: results = [], isLoading } = useQuery({
		queryKey: logoQueryKeys.search(debouncedSearch),
		queryFn: () => fetchLogoResults(debouncedSearch),
		enabled: open && debouncedSearch.trim().length > 0,
		staleTime: 1000 * 60 * 60,
	});

	function handleSelect(result: LogoResult) {
		startTransition(async () => {
			await saveEstablishmentLogoAction(name, result.domain);
			queryClient.setQueryData(logoQueryKeys.mapping(toNameKey(name)), {
				domain: result.domain,
				logoUrl: result.logoUrl,
			});
			onSelect(result.domain);
		});
	}

	function handleReset() {
		startTransition(async () => {
			await removeEstablishmentLogoAction(name);
			queryClient.setQueryData(logoQueryKeys.mapping(toNameKey(name)), {
				domain: null,
				logoUrl: null,
			});
			onSelect(null);
		});
	}

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-80 p-3" align="start" side="bottom">
				<p className="mb-2 text-muted-foreground text-xs">
					Escolha um logo para <strong>{name}</strong>
				</p>

				<Input
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Buscar marca..."
					className="mb-3 h-8 text-sm"
					autoFocus
				/>

				{isLoading ? (
					<div className="flex h-24 items-center justify-center">
						<Spinner />
					</div>
				) : (
					<div className="max-h-64 overflow-y-auto">
						<div className="grid grid-cols-5 gap-1.5">
							<button
								type="button"
								disabled={isPending}
								onClick={handleReset}
								className={cn(
									"flex flex-col items-center gap-1 rounded-md p-1.5 text-center transition-colors hover:bg-accent disabled:opacity-50",
									resolvedDomain === null &&
										"ring-2 ring-primary ring-offset-1",
								)}
								title="Usar iniciais coloridas"
							>
								<div
									className="flex items-center justify-center rounded-md font-medium text-xs"
									style={{
										width: 36,
										height: 36,
										backgroundColor: getCategoryBgColorFromName(name),
										color: getCategoryColorFromName(name),
									}}
									aria-hidden
								>
									{buildInitials(name)}
								</div>
								<span className="w-full truncate text-xs leading-tight text-muted-foreground">
									Iniciais
								</span>
							</button>

							{results.map((r) => (
								<button
									key={r.domain}
									type="button"
									disabled={isPending}
									onClick={() => handleSelect(r)}
									className={cn(
										"flex flex-col items-center gap-1 rounded-md p-1.5 text-center transition-colors hover:bg-accent disabled:opacity-50",
										resolvedDomain === r.domain &&
											"ring-2 ring-primary ring-offset-1",
									)}
									title={r.name}
								>
									<img
										src={r.logoUrl ?? ""}
										alt={r.name}
										width={36}
										height={36}
										className="rounded-md object-contain"
										style={{ width: 36, height: 36 }}
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = "none";
										}}
									/>
									<span className="w-full truncate text-xs leading-tight">
										{r.name}
									</span>
								</button>
							))}
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
